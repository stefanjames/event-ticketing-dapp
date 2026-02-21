// SPDX-License-Identifier: MIT
// @title EventTicketing — Decentralized event ticketing with on-chain ownership
// @notice Solidity 0.8.24 provides built-in overflow/underflow protection (SWC-101)
// @dev Locked pragma per SWC-103. No floating version.
pragma solidity 0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title EventTicketing
/// @author Stefan James
/// @notice Create events, sell tickets, transfer/refund tickets, validate entry — all on-chain.
/// @dev Security: ReentrancyGuard (SWC-107), Pausable (emergency stop), Ownable (admin),
///      Checks-Effects-Interactions on all ETH transfers, pull-over-push refunds (SWC-113),
///      no tx.origin (SWC-115), no address(this).balance for logic (SWC-132).
contract EventTicketing is ReentrancyGuard, Pausable, Ownable {
    // ─── Enums ───────────────────────────────────────────────────────────────────

    enum EventStatus { Active, Canceled, Completed }
    enum TicketStatus { Valid, Used, Refunded }

    // ─── Structs ─────────────────────────────────────────────────────────────────

    struct Event {
        uint256 eventId;
        address payable organizer;
        string name;
        string description;
        string venue;
        uint256 date;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 refundDeadline;
        EventStatus status;
    }

    struct Ticket {
        uint256 ticketId;
        uint256 eventId;
        address owner;
        uint256 purchasePrice;
        TicketStatus status;
        uint256 purchasedAt;
    }

    // ─── State Variables (SWC-108: explicit visibility on all) ───────────────────

    uint256 private _nextEventId;
    uint256 private _nextTicketId;

    /// @dev eventId => Event
    mapping(uint256 => Event) private _events;
    /// @dev ticketId => Ticket
    mapping(uint256 => Ticket) private _tickets;
    /// @dev eventId => ticketId[]
    mapping(uint256 => uint256[]) private _eventTicketIds;
    /// @dev user => ticketId[]
    mapping(address => uint256[]) private _userTickets;
    /// @dev eventId => user => ticket count
    mapping(uint256 => mapping(address => uint256)) private _userEventTicketCount;
    /// @dev eventId => amount already withdrawn (SWC-105: prevent double withdrawal)
    mapping(uint256 => uint256) private _withdrawnAmounts;
    /// @dev eventId => total amount refunded (track for accurate withdrawal calc)
    mapping(uint256 => uint256) private _refundedAmounts;

    /// @notice Maximum tickets per single purchase to prevent gas limit issues
    uint256 public constant MAX_TICKETS_PER_PURCHASE = 10;

    // ─── Events (SWC-135: every event serves off-chain indexing purpose) ─────────

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        string name,
        uint256 date,
        uint256 ticketPrice,
        uint256 maxTickets
    );

    event TicketPurchased(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed buyer,
        uint256 price
    );

    event TicketTransferred(
        uint256 indexed ticketId,
        address indexed from,
        address indexed to
    );

    event TicketRefunded(
        uint256 indexed ticketId,
        uint256 indexed eventId,
        address indexed owner,
        uint256 amount
    );

    event TicketValidated(
        uint256 indexed ticketId,
        uint256 indexed eventId
    );

    event EventCanceled(uint256 indexed eventId);
    event EventCompleted(uint256 indexed eventId);

    event FundsWithdrawn(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 amount
    );

    // ─── Custom Errors ───────────────────────────────────────────────────────────

    error EventDoesNotExist(uint256 eventId);
    error TicketDoesNotExist(uint256 ticketId);
    error NotOrganizer(address caller, address organizer);
    error NotTicketOwner(address caller, address owner);
    error EventNotActive(uint256 eventId, EventStatus status);
    error EventNotCanceled(uint256 eventId, EventStatus status);
    error EventNotCompleted(uint256 eventId, EventStatus status);
    error EmptyString(string field);
    error ZeroAddress();
    error InvalidDate(uint256 date);
    error InvalidRefundDeadline(uint256 refundDeadline, uint256 eventDate);
    error ZeroPrice();
    error ZeroTickets();
    error ZeroQuantity();
    error ExceedsMaxPerPurchase(uint256 quantity, uint256 max);
    error SoldOut(uint256 eventId, uint256 available, uint256 requested);
    error IncorrectPayment(uint256 sent, uint256 required);
    error RefundDeadlinePassed(uint256 deadline, uint256 currentTime);
    error TicketNotValid(uint256 ticketId, TicketStatus status);
    error EventNotEnded(uint256 eventId, uint256 eventDate, uint256 currentTime);
    error NoFundsToWithdraw(uint256 eventId);
    error TransferToSelf();
    error ETHTransferFailed(address recipient, uint256 amount);
    error StringTooLong(string field, uint256 length, uint256 maxLength);

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    /// @dev SWC-100: explicit visibility is enforced by using modifiers on public/external fns
    modifier eventExists(uint256 eventId) {
        if (eventId == 0 || eventId >= _nextEventId) revert EventDoesNotExist(eventId);
        _;
    }

    modifier ticketExists(uint256 ticketId) {
        if (ticketId == 0 || ticketId >= _nextTicketId) revert TicketDoesNotExist(ticketId);
        _;
    }

    modifier onlyOrganizer(uint256 eventId) {
        if (msg.sender != _events[eventId].organizer) {
            revert NotOrganizer(msg.sender, _events[eventId].organizer);
        }
        _;
    }

    modifier onlyTicketOwner(uint256 ticketId) {
        if (msg.sender != _tickets[ticketId].owner) {
            revert NotTicketOwner(msg.sender, _tickets[ticketId].owner);
        }
        _;
    }

    modifier eventActive(uint256 eventId) {
        if (_events[eventId].status != EventStatus.Active) {
            revert EventNotActive(eventId, _events[eventId].status);
        }
        _;
    }

    // ─── Constructor (SWC-118: uses constructor keyword) ─────────────────────────

    /// @notice Deploys the EventTicketing contract
    /// @dev Initializes Ownable with deployer as owner. IDs start at 1.
    constructor() Ownable(msg.sender) {
        _nextEventId = 1;
        _nextTicketId = 1;
    }

    // ─── Event Management ────────────────────────────────────────────────────────

    /// @notice Create a new event
    /// @param name Event name (non-empty, max 256 chars)
    /// @param description Event description (non-empty, max 1024 chars)
    /// @param venue Event venue (non-empty, max 256 chars)
    /// @param date Unix timestamp of the event (must be in the future)
    /// @param ticketPrice Price per ticket in wei (must be > 0)
    /// @param maxTickets Maximum tickets available (must be > 0)
    /// @param refundDeadline Unix timestamp before which refunds are allowed (must be before event date)
    /// @return eventId The ID of the newly created event
    /// @dev SWC-116: block.timestamp used for date validation. Miner manipulation ~15s is acceptable for event-scale timeframes.
    function createEvent(
        string calldata name,
        string calldata description,
        string calldata venue,
        uint256 date,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 refundDeadline
    ) external whenNotPaused returns (uint256 eventId) {
        // Input validation
        _validateString(name, "name", 256);
        _validateString(description, "description", 1024);
        _validateString(venue, "venue", 256);
        if (date <= block.timestamp) revert InvalidDate(date);
        if (ticketPrice == 0) revert ZeroPrice();
        if (maxTickets == 0) revert ZeroTickets();
        if (refundDeadline >= date) revert InvalidRefundDeadline(refundDeadline, date);

        eventId = _nextEventId;
        // SWC-101: Solidity 0.8.24 has built-in overflow protection.
        // unchecked is safe here: _nextEventId won't realistically reach 2^256.
        unchecked { _nextEventId++; }

        _events[eventId] = Event({
            eventId: eventId,
            organizer: payable(msg.sender),
            name: name,
            description: description,
            venue: venue,
            date: date,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            ticketsSold: 0,
            refundDeadline: refundDeadline,
            status: EventStatus.Active
        });

        emit EventCreated(eventId, msg.sender, name, date, ticketPrice, maxTickets);
    }

    /// @notice Cancel an event. Does NOT auto-refund — ticket holders must call requestRefund themselves.
    /// @param eventId The event to cancel
    /// @dev SWC-113: Pull-over-push pattern. No loop over ticket holders. Each user claims their own refund.
    function cancelEvent(uint256 eventId)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
        eventActive(eventId)
        whenNotPaused
    {
        _events[eventId].status = EventStatus.Canceled;
        emit EventCanceled(eventId);
    }

    /// @notice Mark an event as completed after the event date has passed
    /// @param eventId The event to complete
    function completeEvent(uint256 eventId)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
        eventActive(eventId)
        whenNotPaused
    {
        if (block.timestamp < _events[eventId].date) {
            revert EventNotEnded(eventId, _events[eventId].date, block.timestamp);
        }

        _events[eventId].status = EventStatus.Completed;
        emit EventCompleted(eventId);
    }

    // ─── Ticket Operations ───────────────────────────────────────────────────────

    /// @notice Purchase one or more tickets for an active event
    /// @param eventId The event to purchase tickets for
    /// @param quantity Number of tickets to purchase (1 to MAX_TICKETS_PER_PURCHASE)
    /// @return ticketIds Array of newly minted ticket IDs
    /// @dev SWC-107: nonReentrant guard. SWC-114: availability checked after payment validation.
    function purchaseTickets(uint256 eventId, uint256 quantity)
        external
        payable
        eventExists(eventId)
        eventActive(eventId)
        nonReentrant
        whenNotPaused
        returns (uint256[] memory ticketIds)
    {
        if (quantity == 0) revert ZeroQuantity();
        if (quantity > MAX_TICKETS_PER_PURCHASE) {
            revert ExceedsMaxPerPurchase(quantity, MAX_TICKETS_PER_PURCHASE);
        }

        Event storage evt = _events[eventId];

        // SWC-116: block.timestamp check — acceptable for event-scale timeframes
        if (block.timestamp >= evt.date) {
            revert EventNotEnded(eventId, evt.date, block.timestamp);
        }

        // Check availability (SWC-114: validate after receiving payment context)
        uint256 available = evt.maxTickets - evt.ticketsSold;
        if (quantity > available) {
            revert SoldOut(eventId, available, quantity);
        }

        // Validate exact payment
        uint256 totalCost = evt.ticketPrice * quantity;
        if (msg.value != totalCost) {
            revert IncorrectPayment(msg.value, totalCost);
        }

        // Effects: update state BEFORE any potential interactions (Checks-Effects-Interactions)
        evt.ticketsSold += quantity;
        ticketIds = new uint256[](quantity);

        for (uint256 i = 0; i < quantity;) {
            uint256 ticketId = _nextTicketId;
            unchecked { _nextTicketId++; }

            _tickets[ticketId] = Ticket({
                ticketId: ticketId,
                eventId: eventId,
                owner: msg.sender,
                purchasePrice: evt.ticketPrice,
                status: TicketStatus.Valid,
                purchasedAt: block.timestamp
            });

            _eventTicketIds[eventId].push(ticketId);
            _userTickets[msg.sender].push(ticketId);
            ticketIds[i] = ticketId;

            emit TicketPurchased(ticketId, eventId, msg.sender, evt.ticketPrice);

            unchecked { i++; }
        }

        _userEventTicketCount[eventId][msg.sender] += quantity;
    }

    /// @notice Transfer a valid ticket to another address
    /// @param ticketId The ticket to transfer
    /// @param to The recipient address
    function transferTicket(uint256 ticketId, address to)
        external
        ticketExists(ticketId)
        onlyTicketOwner(ticketId)
        whenNotPaused
    {
        if (to == address(0)) revert ZeroAddress();
        if (to == msg.sender) revert TransferToSelf();

        Ticket storage ticket = _tickets[ticketId];
        if (ticket.status != TicketStatus.Valid) {
            revert TicketNotValid(ticketId, ticket.status);
        }

        address from = ticket.owner;

        // Effects
        ticket.owner = to;
        _userTickets[to].push(ticketId);
        _userEventTicketCount[ticket.eventId][from] -= 1;
        _userEventTicketCount[ticket.eventId][to] += 1;

        emit TicketTransferred(ticketId, from, to);
    }

    /// @notice Request a refund for a ticket before the refund deadline or if event is canceled
    /// @param ticketId The ticket to refund
    /// @dev SWC-107: nonReentrant + Checks-Effects-Interactions. SWC-104: call return value checked.
    ///      SWC-113: Individual pull-based refund — no batch loops.
    function requestRefund(uint256 ticketId)
        external
        ticketExists(ticketId)
        onlyTicketOwner(ticketId)
        nonReentrant
        whenNotPaused
    {
        Ticket storage ticket = _tickets[ticketId];
        if (ticket.status != TicketStatus.Valid) {
            revert TicketNotValid(ticketId, ticket.status);
        }

        Event storage evt = _events[ticket.eventId];

        // Allow refund if: event is canceled OR refund deadline hasn't passed
        if (evt.status != EventStatus.Canceled) {
            if (block.timestamp >= evt.refundDeadline) {
                revert RefundDeadlinePassed(evt.refundDeadline, block.timestamp);
            }
        }

        uint256 refundAmount = ticket.purchasePrice;

        // Effects BEFORE interactions (Checks-Effects-Interactions)
        ticket.status = TicketStatus.Refunded;
        _refundedAmounts[ticket.eventId] += refundAmount;
        _userEventTicketCount[ticket.eventId][msg.sender] -= 1;

        emit TicketRefunded(ticketId, ticket.eventId, msg.sender, refundAmount);

        // Interactions: transfer ETH last
        // SWC-104: check return value. SWC-107: nonReentrant prevents reentry.
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        if (!success) revert ETHTransferFailed(msg.sender, refundAmount);
    }

    /// @notice Validate a ticket at event entry — marks it as Used
    /// @param ticketId The ticket to validate
    function validateTicket(uint256 ticketId)
        external
        ticketExists(ticketId)
        whenNotPaused
    {
        Ticket storage ticket = _tickets[ticketId];
        Event storage evt = _events[ticket.eventId];

        if (msg.sender != evt.organizer) {
            revert NotOrganizer(msg.sender, evt.organizer);
        }
        if (ticket.status != TicketStatus.Valid) {
            revert TicketNotValid(ticketId, ticket.status);
        }

        ticket.status = TicketStatus.Used;

        emit TicketValidated(ticketId, ticket.eventId);
    }

    // ─── Fund Management ─────────────────────────────────────────────────────────

    /// @notice Withdraw event revenue after the event is completed
    /// @param eventId The event to withdraw funds from
    /// @dev SWC-105: Only organizer can withdraw, only after completion, tracks withdrawn amounts.
    ///      SWC-107: nonReentrant. SWC-132: Uses internal accounting, not address(this).balance.
    function withdrawEventFunds(uint256 eventId)
        external
        eventExists(eventId)
        onlyOrganizer(eventId)
        nonReentrant
        whenNotPaused
    {
        Event storage evt = _events[eventId];
        if (evt.status != EventStatus.Completed) {
            revert EventNotCompleted(eventId, evt.status);
        }

        // SWC-132: Calculate from internal state, not address(this).balance
        uint256 totalRevenue = evt.ticketsSold * evt.ticketPrice;
        uint256 totalRefunded = _refundedAmounts[eventId];
        uint256 netRevenue = totalRevenue - totalRefunded;
        uint256 alreadyWithdrawn = _withdrawnAmounts[eventId];

        if (netRevenue <= alreadyWithdrawn) {
            revert NoFundsToWithdraw(eventId);
        }

        uint256 withdrawable = netRevenue - alreadyWithdrawn;

        // Effects BEFORE interactions
        _withdrawnAmounts[eventId] = netRevenue;

        emit FundsWithdrawn(eventId, msg.sender, withdrawable);

        // Interactions: transfer ETH last
        // SWC-104: check return value
        (bool success, ) = payable(msg.sender).call{value: withdrawable}("");
        if (!success) revert ETHTransferFailed(msg.sender, withdrawable);
    }

    // ─── View Functions ──────────────────────────────────────────────────────────

    /// @notice Get event details
    function getEvent(uint256 eventId)
        external
        view
        eventExists(eventId)
        returns (Event memory)
    {
        return _events[eventId];
    }

    /// @notice Get ticket details
    function getTicket(uint256 ticketId)
        external
        view
        ticketExists(ticketId)
        returns (Ticket memory)
    {
        return _tickets[ticketId];
    }

    /// @notice Get all ticket IDs for an event
    function getEventTickets(uint256 eventId)
        external
        view
        eventExists(eventId)
        returns (uint256[] memory)
    {
        return _eventTicketIds[eventId];
    }

    /// @notice Get all ticket IDs owned by a user
    function getUserTickets(address user) external view returns (uint256[] memory) {
        return _userTickets[user];
    }

    /// @notice Get remaining available tickets for an event
    function getAvailableTickets(uint256 eventId)
        external
        view
        eventExists(eventId)
        returns (uint256)
    {
        return _events[eventId].maxTickets - _events[eventId].ticketsSold;
    }

    /// @notice Check if a ticket is valid for entry
    function isTicketValid(uint256 ticketId)
        external
        view
        ticketExists(ticketId)
        returns (bool)
    {
        return _tickets[ticketId].status == TicketStatus.Valid;
    }

    /// @notice Get the total number of events created
    function eventCount() external view returns (uint256) {
        return _nextEventId - 1;
    }

    /// @notice Get the total number of tickets minted
    function ticketCount() external view returns (uint256) {
        return _nextTicketId - 1;
    }

    /// @notice Get withdrawn amount for an event
    function getWithdrawnAmount(uint256 eventId)
        external
        view
        eventExists(eventId)
        returns (uint256)
    {
        return _withdrawnAmounts[eventId];
    }

    /// @notice Get refunded amount for an event
    function getRefundedAmount(uint256 eventId)
        external
        view
        eventExists(eventId)
        returns (uint256)
    {
        return _refundedAmounts[eventId];
    }

    /// @notice Get user's ticket count for a specific event
    function getUserEventTicketCount(uint256 eventId, address user)
        external
        view
        returns (uint256)
    {
        return _userEventTicketCount[eventId][user];
    }

    // ─── Admin / Emergency ───────────────────────────────────────────────────────

    /// @notice Pause all contract operations in case of emergency
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resume contract operations
    function unpause() external onlyOwner {
        _unpause();
    }

    // ─── Receive / Fallback ──────────────────────────────────────────────────────

    /// @dev SWC-132: Reject unexpected ETH to prevent balance manipulation.
    ///      All ETH should come through purchaseTickets().
    receive() external payable {
        revert("Direct ETH transfers not accepted");
    }

    /// @dev Reject calls to non-existent functions
    fallback() external payable {
        revert("Function does not exist");
    }

    // ─── Internal Helpers (SWC-100: private visibility) ──────────────────────────

    /// @dev Validate a string is non-empty and within max length
    function _validateString(
        string calldata value,
        string memory field,
        uint256 maxLength
    ) private pure {
        uint256 len = bytes(value).length;
        if (len == 0) revert EmptyString(field);
        if (len > maxLength) revert StringTooLong(field, len, maxLength);
    }
}
