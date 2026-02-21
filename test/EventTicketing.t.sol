// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EventTicketing} from "../src/EventTicketing.sol";

/// @title EventTicketing Test Suite
/// @notice Comprehensive tests: happy paths, access control, edge cases, reentrancy, financial accuracy
contract EventTicketingTest is Test {
    EventTicketing public ticketing;

    address public owner;
    address public organizer;
    address public buyer1;
    address public buyer2;
    address public attacker;

    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant MAX_TICKETS = 100;

    // Default event parameters
    string public constant EVENT_NAME = "ETHGlobal SF 2025";
    string public constant EVENT_DESC = "The biggest Ethereum hackathon in San Francisco";
    string public constant EVENT_VENUE = "Moscone Center, San Francisco";

    function setUp() public {
        owner = address(this);
        organizer = makeAddr("organizer");
        buyer1 = makeAddr("buyer1");
        buyer2 = makeAddr("buyer2");
        attacker = makeAddr("attacker");

        ticketing = new EventTicketing();

        // Fund test accounts
        vm.deal(organizer, 10 ether);
        vm.deal(buyer1, 10 ether);
        vm.deal(buyer2, 10 ether);
        vm.deal(attacker, 10 ether);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    function _eventDate() internal view returns (uint256) {
        return block.timestamp + 30 days;
    }

    function _refundDeadline() internal view returns (uint256) {
        return block.timestamp + 20 days;
    }

    function _createDefaultEvent() internal returns (uint256 eventId) {
        vm.prank(organizer);
        eventId = ticketing.createEvent(
            EVENT_NAME,
            EVENT_DESC,
            EVENT_VENUE,
            _eventDate(),
            TICKET_PRICE,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    function _createAndBuyTicket() internal returns (uint256 eventId, uint256 ticketId) {
        eventId = _createDefaultEvent();
        vm.prank(buyer1);
        uint256[] memory ticketIds = ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);
        ticketId = ticketIds[0];
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // DEPLOYMENT TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_deployment_setsOwner() public view {
        assertEq(ticketing.owner(), owner);
    }

    function test_deployment_initialCountsZero() public view {
        assertEq(ticketing.eventCount(), 0);
        assertEq(ticketing.ticketCount(), 0);
    }

    function test_deployment_maxTicketsPerPurchase() public view {
        assertEq(ticketing.MAX_TICKETS_PER_PURCHASE(), 10);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // HAPPY PATH TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_createEvent_success() public {
        uint256 date = _eventDate();
        uint256 deadline = _refundDeadline();

        vm.prank(organizer);
        vm.expectEmit(true, true, false, true);
        emit EventTicketing.EventCreated(1, organizer, EVENT_NAME, date, TICKET_PRICE, MAX_TICKETS);

        uint256 eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE, date, TICKET_PRICE, MAX_TICKETS, deadline
        );

        assertEq(eventId, 1);
        assertEq(ticketing.eventCount(), 1);

        EventTicketing.Event memory evt = ticketing.getEvent(eventId);
        assertEq(evt.eventId, 1);
        assertEq(evt.organizer, organizer);
        assertEq(evt.name, EVENT_NAME);
        assertEq(evt.description, EVENT_DESC);
        assertEq(evt.venue, EVENT_VENUE);
        assertEq(evt.date, date);
        assertEq(evt.ticketPrice, TICKET_PRICE);
        assertEq(evt.maxTickets, MAX_TICKETS);
        assertEq(evt.ticketsSold, 0);
        assertEq(evt.refundDeadline, deadline);
        assertEq(uint256(evt.status), uint256(EventTicketing.EventStatus.Active));
    }

    function test_createEvent_multipleEvents() public {
        vm.startPrank(organizer);
        uint256 id1 = ticketing.createEvent(
            "Event 1", "Desc 1", "Venue 1", _eventDate(), TICKET_PRICE, 50, _refundDeadline()
        );
        uint256 id2 = ticketing.createEvent(
            "Event 2", "Desc 2", "Venue 2", _eventDate(), 0.2 ether, 200, _refundDeadline()
        );
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(ticketing.eventCount(), 2);
    }

    function test_purchaseTickets_single() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        vm.expectEmit(true, true, true, true);
        emit EventTicketing.TicketPurchased(1, eventId, buyer1, TICKET_PRICE);

        uint256[] memory ticketIds = ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);

        assertEq(ticketIds.length, 1);
        assertEq(ticketIds[0], 1);
        assertEq(ticketing.ticketCount(), 1);

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketIds[0]);
        assertEq(ticket.ticketId, 1);
        assertEq(ticket.eventId, eventId);
        assertEq(ticket.owner, buyer1);
        assertEq(ticket.purchasePrice, TICKET_PRICE);
        assertEq(uint256(ticket.status), uint256(EventTicketing.TicketStatus.Valid));

        assertEq(ticketing.getAvailableTickets(eventId), MAX_TICKETS - 1);
    }

    function test_purchaseTickets_multiple() public {
        uint256 eventId = _createDefaultEvent();
        uint256 quantity = 5;

        vm.prank(buyer1);
        uint256[] memory ticketIds = ticketing.purchaseTickets{value: TICKET_PRICE * quantity}(eventId, quantity);

        assertEq(ticketIds.length, quantity);
        assertEq(ticketing.ticketCount(), quantity);
        assertEq(ticketing.getAvailableTickets(eventId), MAX_TICKETS - quantity);

        for (uint256 i = 0; i < quantity; i++) {
            assertEq(ticketIds[i], i + 1);
            EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketIds[i]);
            assertEq(ticket.owner, buyer1);
        }
    }

    function test_transferTicket_success() public {
        (uint256 eventId, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(buyer1);
        vm.expectEmit(true, true, true, true);
        emit EventTicketing.TicketTransferred(ticketId, buyer1, buyer2);

        ticketing.transferTicket(ticketId, buyer2);

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        assertEq(ticket.owner, buyer2);

        assertEq(ticketing.getUserEventTicketCount(eventId, buyer1), 0);
        assertEq(ticketing.getUserEventTicketCount(eventId, buyer2), 1);
    }

    function test_requestRefund_beforeDeadline() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        uint256 balanceBefore = buyer1.balance;

        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);

        assertEq(buyer1.balance, balanceBefore + TICKET_PRICE);

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        assertEq(uint256(ticket.status), uint256(EventTicketing.TicketStatus.Refunded));
    }

    function test_requestRefund_canceledEvent() public {
        (, uint256 ticketId) = _createAndBuyTicket();
        uint256 eventId = ticketing.getTicket(ticketId).eventId;

        // Warp past refund deadline
        vm.warp(block.timestamp + 25 days);

        // Cancel event
        vm.prank(organizer);
        ticketing.cancelEvent(eventId);

        // Refund should work even after deadline because event is canceled
        uint256 balanceBefore = buyer1.balance;
        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);

        assertEq(buyer1.balance, balanceBefore + TICKET_PRICE);
    }

    function test_validateTicket_byOrganizer() public {
        (uint256 eventId, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(organizer);
        vm.expectEmit(true, true, false, true);
        emit EventTicketing.TicketValidated(ticketId, eventId);

        ticketing.validateTicket(ticketId);

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        assertEq(uint256(ticket.status), uint256(EventTicketing.TicketStatus.Used));
        assertFalse(ticketing.isTicketValid(ticketId));
    }

    function test_cancelEvent_byOrganizer() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit EventTicketing.EventCanceled(eventId);

        ticketing.cancelEvent(eventId);

        EventTicketing.Event memory evt = ticketing.getEvent(eventId);
        assertEq(uint256(evt.status), uint256(EventTicketing.EventStatus.Canceled));
    }

    function test_completeEvent_afterDate() public {
        uint256 eventId = _createDefaultEvent();

        // Warp past event date
        vm.warp(block.timestamp + 31 days);

        vm.prank(organizer);
        vm.expectEmit(true, false, false, true);
        emit EventTicketing.EventCompleted(eventId);

        ticketing.completeEvent(eventId);

        EventTicketing.Event memory evt = ticketing.getEvent(eventId);
        assertEq(uint256(evt.status), uint256(EventTicketing.EventStatus.Completed));
    }

    function test_withdrawFunds_afterCompletion() public {
        uint256 eventId = _createDefaultEvent();

        // Buy 5 tickets
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 5}(eventId, 5);

        // Warp past event date and complete
        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        uint256 balanceBefore = organizer.balance;
        uint256 expectedWithdrawal = TICKET_PRICE * 5;

        vm.prank(organizer);
        vm.expectEmit(true, true, false, true);
        emit EventTicketing.FundsWithdrawn(eventId, organizer, expectedWithdrawal);

        ticketing.withdrawEventFunds(eventId);

        assertEq(organizer.balance, balanceBefore + expectedWithdrawal);
        assertEq(ticketing.getWithdrawnAmount(eventId), expectedWithdrawal);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // ACCESS CONTROL TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_cancelEvent_notOrganizer() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotOrganizer.selector, attacker, organizer)
        );
        ticketing.cancelEvent(eventId);
    }

    function test_revert_completeEvent_notOrganizer() public {
        uint256 eventId = _createDefaultEvent();
        vm.warp(block.timestamp + 31 days);

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotOrganizer.selector, attacker, organizer)
        );
        ticketing.completeEvent(eventId);
    }

    function test_revert_validateTicket_notOrganizer() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(buyer1); // buyer is not organizer
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotOrganizer.selector, buyer1, organizer)
        );
        ticketing.validateTicket(ticketId);
    }

    function test_revert_transferTicket_notOwner() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotTicketOwner.selector, attacker, buyer1)
        );
        ticketing.transferTicket(ticketId, buyer2);
    }

    function test_revert_requestRefund_notOwner() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotTicketOwner.selector, attacker, buyer1)
        );
        ticketing.requestRefund(ticketId);
    }

    function test_revert_withdrawFunds_notOrganizer() public {
        uint256 eventId = _createDefaultEvent();
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);

        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        vm.prank(attacker);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NotOrganizer.selector, attacker, organizer)
        );
        ticketing.withdrawEventFunds(eventId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EDGE CASE TESTS — PURCHASE
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_purchaseTickets_soldOut() public {
        // Create event with only 2 tickets
        vm.prank(organizer);
        uint256 eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE, _eventDate(), TICKET_PRICE, 2, _refundDeadline()
        );

        // Buy 2
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 2}(eventId, 2);

        // Try to buy 1 more
        vm.prank(buyer2);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.SoldOut.selector, eventId, 0, 1)
        );
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);
    }

    function test_revert_purchaseTickets_eventCanceled() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(organizer);
        ticketing.cancelEvent(eventId);

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.EventNotActive.selector,
                eventId,
                EventTicketing.EventStatus.Canceled
            )
        );
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);
    }

    function test_revert_purchaseTickets_eventExpired() public {
        uint256 eventId = _createDefaultEvent();

        // Warp past event date
        vm.warp(block.timestamp + 31 days);

        vm.prank(buyer1);
        vm.expectRevert();
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);
    }

    function test_revert_purchaseTickets_incorrectPayment() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.IncorrectPayment.selector, 0.05 ether, TICKET_PRICE
            )
        );
        ticketing.purchaseTickets{value: 0.05 ether}(eventId, 1);
    }

    function test_revert_purchaseTickets_overpayment() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.IncorrectPayment.selector, 0.2 ether, TICKET_PRICE
            )
        );
        ticketing.purchaseTickets{value: 0.2 ether}(eventId, 1);
    }

    function test_revert_purchaseTickets_zeroQuantity() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        vm.expectRevert(EventTicketing.ZeroQuantity.selector);
        ticketing.purchaseTickets{value: 0}(eventId, 0);
    }

    function test_revert_purchaseTickets_exceedsMax() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.ExceedsMaxPerPurchase.selector, 11, 10)
        );
        ticketing.purchaseTickets{value: TICKET_PRICE * 11}(eventId, 11);
    }

    function test_revert_purchaseTickets_exceedsAvailable() public {
        // Create event with 3 max tickets
        vm.prank(organizer);
        uint256 eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE, _eventDate(), TICKET_PRICE, 3, _refundDeadline()
        );

        // Buy 2 successfully
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 2}(eventId, 2);

        // Try to buy 2 more (only 1 available)
        vm.prank(buyer2);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.SoldOut.selector, eventId, 1, 2)
        );
        ticketing.purchaseTickets{value: TICKET_PRICE * 2}(eventId, 2);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EDGE CASE TESTS — REFUND
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_refund_afterDeadline() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        // Warp past refund deadline
        vm.warp(block.timestamp + 25 days);

        vm.prank(buyer1);
        vm.expectRevert();
        ticketing.requestRefund(ticketId);
    }

    function test_revert_refund_alreadyUsed() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        // Validate ticket (mark as used)
        vm.prank(organizer);
        ticketing.validateTicket(ticketId);

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.TicketNotValid.selector,
                ticketId,
                EventTicketing.TicketStatus.Used
            )
        );
        ticketing.requestRefund(ticketId);
    }

    function test_revert_refund_alreadyRefunded() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        // First refund succeeds
        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);

        // Second refund fails
        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.TicketNotValid.selector,
                ticketId,
                EventTicketing.TicketStatus.Refunded
            )
        );
        ticketing.requestRefund(ticketId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EDGE CASE TESTS — TRANSFER
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_transferTicket_toZeroAddress() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(buyer1);
        vm.expectRevert(EventTicketing.ZeroAddress.selector);
        ticketing.transferTicket(ticketId, address(0));
    }

    function test_revert_transferTicket_toSelf() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(buyer1);
        vm.expectRevert(EventTicketing.TransferToSelf.selector);
        ticketing.transferTicket(ticketId, buyer1);
    }

    function test_revert_transferTicket_alreadyUsed() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(organizer);
        ticketing.validateTicket(ticketId);

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.TicketNotValid.selector,
                ticketId,
                EventTicketing.TicketStatus.Used
            )
        );
        ticketing.transferTicket(ticketId, buyer2);
    }

    function test_revert_transferTicket_alreadyRefunded() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);

        vm.prank(buyer1);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.TicketNotValid.selector,
                ticketId,
                EventTicketing.TicketStatus.Refunded
            )
        );
        ticketing.transferTicket(ticketId, buyer2);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EDGE CASE TESTS — VALIDATE
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_validateTicket_alreadyUsed() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(organizer);
        ticketing.validateTicket(ticketId);

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.TicketNotValid.selector,
                ticketId,
                EventTicketing.TicketStatus.Used
            )
        );
        ticketing.validateTicket(ticketId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EDGE CASE TESTS — CREATE EVENT
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_createEvent_pastDate() public {
        // Warp to a reasonable timestamp so subtraction is safe
        vm.warp(1000);
        uint256 pastDate = block.timestamp - 1;

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.InvalidDate.selector, pastDate)
        );
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            pastDate,
            TICKET_PRICE,
            MAX_TICKETS,
            pastDate - 1
        );
    }

    function test_revert_createEvent_zeroPrice() public {
        vm.prank(organizer);
        vm.expectRevert(EventTicketing.ZeroPrice.selector);
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            _eventDate(),
            0,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    function test_revert_createEvent_zeroTickets() public {
        vm.prank(organizer);
        vm.expectRevert(EventTicketing.ZeroTickets.selector);
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            _eventDate(),
            TICKET_PRICE,
            0,
            _refundDeadline()
        );
    }

    function test_revert_createEvent_emptyName() public {
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.EmptyString.selector, "name"));
        ticketing.createEvent(
            "", EVENT_DESC, EVENT_VENUE,
            _eventDate(),
            TICKET_PRICE,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    function test_revert_createEvent_emptyDescription() public {
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.EmptyString.selector, "description"));
        ticketing.createEvent(
            EVENT_NAME, "", EVENT_VENUE,
            _eventDate(),
            TICKET_PRICE,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    function test_revert_createEvent_emptyVenue() public {
        vm.prank(organizer);
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.EmptyString.selector, "venue"));
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, "",
            _eventDate(),
            TICKET_PRICE,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    function test_revert_createEvent_refundDeadlineAfterDate() public {
        uint256 date = _eventDate();

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.InvalidRefundDeadline.selector, date + 1, date)
        );
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            date,
            TICKET_PRICE,
            MAX_TICKETS,
            date + 1
        );
    }

    function test_revert_createEvent_refundDeadlineEqualsDate() public {
        uint256 date = _eventDate();

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.InvalidRefundDeadline.selector, date, date)
        );
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            date,
            TICKET_PRICE,
            MAX_TICKETS,
            date
        );
    }

    function test_revert_createEvent_nameTooLong() public {
        // 257 character name
        bytes memory longName = new bytes(257);
        for (uint256 i = 0; i < 257; i++) {
            longName[i] = "A";
        }

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.StringTooLong.selector, "name", 257, 256)
        );
        ticketing.createEvent(
            string(longName), EVENT_DESC, EVENT_VENUE,
            _eventDate(),
            TICKET_PRICE,
            MAX_TICKETS,
            _refundDeadline()
        );
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // EVENT / TICKET EXISTENCE TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_getEvent_doesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.EventDoesNotExist.selector, 1));
        ticketing.getEvent(1);
    }

    function test_revert_getEvent_zeroId() public {
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.EventDoesNotExist.selector, 0));
        ticketing.getEvent(0);
    }

    function test_revert_getTicket_doesNotExist() public {
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.TicketDoesNotExist.selector, 1));
        ticketing.getTicket(1);
    }

    function test_revert_getTicket_zeroId() public {
        vm.expectRevert(abi.encodeWithSelector(EventTicketing.TicketDoesNotExist.selector, 0));
        ticketing.getTicket(0);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // COMPLETE EVENT TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_completeEvent_beforeDate() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(organizer);
        vm.expectRevert();
        ticketing.completeEvent(eventId);
    }

    function test_revert_completeEvent_alreadyCanceled() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(organizer);
        ticketing.cancelEvent(eventId);

        vm.warp(block.timestamp + 31 days);

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.EventNotActive.selector,
                eventId,
                EventTicketing.EventStatus.Canceled
            )
        );
        ticketing.completeEvent(eventId);
    }

    function test_revert_cancelEvent_alreadyCompleted() public {
        uint256 eventId = _createDefaultEvent();

        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.EventNotActive.selector,
                eventId,
                EventTicketing.EventStatus.Completed
            )
        );
        ticketing.cancelEvent(eventId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // WITHDRAWAL TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_withdraw_eventNotCompleted() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicketing.EventNotCompleted.selector,
                eventId,
                EventTicketing.EventStatus.Active
            )
        );
        ticketing.withdrawEventFunds(eventId);
    }

    function test_revert_withdraw_doubleWithdraw() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);

        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        // First withdrawal succeeds
        vm.prank(organizer);
        ticketing.withdrawEventFunds(eventId);

        // Second withdrawal fails
        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NoFundsToWithdraw.selector, eventId)
        );
        ticketing.withdrawEventFunds(eventId);
    }

    function test_revert_withdraw_noTicketsSold() public {
        uint256 eventId = _createDefaultEvent();

        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicketing.NoFundsToWithdraw.selector, eventId)
        );
        ticketing.withdrawEventFunds(eventId);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // REENTRANCY TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_reentrancy_onRefund() public {
        uint256 eventId = _createDefaultEvent();

        // Deploy attacker contract
        ReentrancyAttacker atkContract = new ReentrancyAttacker(address(ticketing));
        vm.deal(address(atkContract), 10 ether);

        // Attacker buys a ticket
        vm.prank(address(atkContract));
        uint256[] memory ticketIds = ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);

        // Set up attack
        atkContract.setTicketId(ticketIds[0]);

        // Attempt reentrancy — should revert with ReentrancyGuardReentrantCall
        vm.prank(address(atkContract));
        vm.expectRevert();
        atkContract.attack();
    }

    function test_revert_reentrancy_onWithdraw() public {
        uint256 eventId;

        // Deploy organizer attacker contract
        WithdrawAttacker atkContract = new WithdrawAttacker(address(ticketing));
        vm.deal(address(atkContract), 10 ether);

        // Create event from attacker contract
        vm.prank(address(atkContract));
        eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE, _eventDate(), TICKET_PRICE, MAX_TICKETS, _refundDeadline()
        );

        // Buyer purchases tickets
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 5}(eventId, 5);

        // Complete event
        vm.warp(block.timestamp + 31 days);
        vm.prank(address(atkContract));
        ticketing.completeEvent(eventId);

        // Set up attack
        atkContract.setEventId(eventId);

        // Attempt reentrancy — should revert
        vm.prank(address(atkContract));
        vm.expectRevert();
        atkContract.attack();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // OVERFLOW / BOUNDARY TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_purchaseTickets_exactlyMaxTickets() public {
        vm.prank(organizer);
        uint256 eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE, _eventDate(), TICKET_PRICE, 10, _refundDeadline()
        );

        // Buy all 10 tickets
        vm.prank(buyer1);
        uint256[] memory ids = ticketing.purchaseTickets{value: TICKET_PRICE * 10}(eventId, 10);

        assertEq(ids.length, 10);
        assertEq(ticketing.getAvailableTickets(eventId), 0);

        EventTicketing.Event memory evt = ticketing.getEvent(eventId);
        assertEq(evt.ticketsSold, evt.maxTickets);
    }

    function test_refundDeadline_exactBoundary() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        EventTicketing.Event memory evt = ticketing.getEvent(ticket.eventId);

        // Warp to exactly the refund deadline — should fail (>= check)
        vm.warp(evt.refundDeadline);

        vm.prank(buyer1);
        vm.expectRevert();
        ticketing.requestRefund(ticketId);
    }

    function test_refundDeadline_oneSecondBefore() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        EventTicketing.Event memory evt = ticketing.getEvent(ticket.eventId);

        // Warp to one second before deadline — should succeed
        vm.warp(evt.refundDeadline - 1);

        uint256 balanceBefore = buyer1.balance;
        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);
        assertEq(buyer1.balance, balanceBefore + TICKET_PRICE);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // FINANCIAL ACCURACY TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_refundAmount_matchesPurchasePrice() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        uint256 balanceBefore = buyer1.balance;

        vm.prank(buyer1);
        ticketing.requestRefund(ticketId);

        assertEq(buyer1.balance - balanceBefore, ticket.purchasePrice);
    }

    function test_withdrawAmount_matchesTicketRevenue() public {
        uint256 eventId = _createDefaultEvent();

        // Buyer1 buys 3, buyer2 buys 2
        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 3}(eventId, 3);
        vm.prank(buyer2);
        ticketing.purchaseTickets{value: TICKET_PRICE * 2}(eventId, 2);

        uint256 totalRevenue = TICKET_PRICE * 5;

        // Complete and withdraw
        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        uint256 balanceBefore = organizer.balance;
        vm.prank(organizer);
        ticketing.withdrawEventFunds(eventId);

        assertEq(organizer.balance - balanceBefore, totalRevenue);
    }

    function test_withdrawAmount_accountsForRefunds() public {
        uint256 eventId = _createDefaultEvent();

        // Buy 5 tickets
        vm.prank(buyer1);
        uint256[] memory ticketIds = ticketing.purchaseTickets{value: TICKET_PRICE * 5}(eventId, 5);

        // Refund 2 tickets
        vm.prank(buyer1);
        ticketing.requestRefund(ticketIds[0]);
        vm.prank(buyer1);
        ticketing.requestRefund(ticketIds[1]);

        // Complete and withdraw
        vm.warp(block.timestamp + 31 days);
        vm.prank(organizer);
        ticketing.completeEvent(eventId);

        uint256 expectedWithdrawal = TICKET_PRICE * 3; // 5 sold - 2 refunded
        uint256 balanceBefore = organizer.balance;

        vm.prank(organizer);
        ticketing.withdrawEventFunds(eventId);

        assertEq(organizer.balance - balanceBefore, expectedWithdrawal);
        assertEq(ticketing.getRefundedAmount(eventId), TICKET_PRICE * 2);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // PAUSABLE TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_pause_preventsCreateEvent() public {
        ticketing.pause();

        vm.prank(organizer);
        vm.expectRevert();
        ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            _eventDate(), TICKET_PRICE, MAX_TICKETS, _refundDeadline()
        );
    }

    function test_pause_preventsPurchase() public {
        uint256 eventId = _createDefaultEvent();
        ticketing.pause();

        vm.prank(buyer1);
        vm.expectRevert();
        ticketing.purchaseTickets{value: TICKET_PRICE}(eventId, 1);
    }

    function test_unpause_resumesOperations() public {
        ticketing.pause();
        ticketing.unpause();

        vm.prank(organizer);
        uint256 eventId = ticketing.createEvent(
            EVENT_NAME, EVENT_DESC, EVENT_VENUE,
            _eventDate(), TICKET_PRICE, MAX_TICKETS, _refundDeadline()
        );

        assertEq(eventId, 1);
    }

    function test_revert_pause_notOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        ticketing.pause();
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // RECEIVE / FALLBACK TESTS (SWC-132)
    // ═════════════════════════════════════════════════════════════════════════════

    function test_revert_directETHTransfer() public {
        vm.prank(buyer1);
        vm.expectRevert("Direct ETH transfers not accepted");
        (bool sent, ) = address(ticketing).call{value: 1 ether}("");
        // Suppress unused variable warning
        sent;
    }

    function test_revert_fallback() public {
        vm.prank(buyer1);
        vm.expectRevert("Function does not exist");
        (bool sent, ) = address(ticketing).call{value: 0}(abi.encodeWithSignature("nonExistentFunction()"));
        sent;
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTION TESTS
    // ═════════════════════════════════════════════════════════════════════════════

    function test_getEventTickets() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 3}(eventId, 3);

        uint256[] memory eventTickets = ticketing.getEventTickets(eventId);
        assertEq(eventTickets.length, 3);
        assertEq(eventTickets[0], 1);
        assertEq(eventTickets[1], 2);
        assertEq(eventTickets[2], 3);
    }

    function test_getUserTickets() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 2}(eventId, 2);

        uint256[] memory userTix = ticketing.getUserTickets(buyer1);
        assertEq(userTix.length, 2);
    }

    function test_isTicketValid_returnsTrue() public {
        (, uint256 ticketId) = _createAndBuyTicket();
        assertTrue(ticketing.isTicketValid(ticketId));
    }

    function test_isTicketValid_returnsFalse_afterUse() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        vm.prank(organizer);
        ticketing.validateTicket(ticketId);

        assertFalse(ticketing.isTicketValid(ticketId));
    }

    function test_getAvailableTickets() public {
        uint256 eventId = _createDefaultEvent();

        assertEq(ticketing.getAvailableTickets(eventId), MAX_TICKETS);

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 5}(eventId, 5);

        assertEq(ticketing.getAvailableTickets(eventId), MAX_TICKETS - 5);
    }

    function test_getUserEventTicketCount() public {
        uint256 eventId = _createDefaultEvent();

        vm.prank(buyer1);
        ticketing.purchaseTickets{value: TICKET_PRICE * 3}(eventId, 3);

        assertEq(ticketing.getUserEventTicketCount(eventId, buyer1), 3);
        assertEq(ticketing.getUserEventTicketCount(eventId, buyer2), 0);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TRANSFER AFTER TRANSFER TEST
    // ═════════════════════════════════════════════════════════════════════════════

    function test_transferTicket_newOwnerCanTransferAgain() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        // buyer1 -> buyer2
        vm.prank(buyer1);
        ticketing.transferTicket(ticketId, buyer2);

        // buyer2 -> organizer
        vm.prank(buyer2);
        ticketing.transferTicket(ticketId, organizer);

        EventTicketing.Ticket memory ticket = ticketing.getTicket(ticketId);
        assertEq(ticket.owner, organizer);
    }

    // ═════════════════════════════════════════════════════════════════════════════
    // TRANSFERRED TICKET REFUND TEST
    // ═════════════════════════════════════════════════════════════════════════════

    function test_requestRefund_afterTransfer() public {
        (, uint256 ticketId) = _createAndBuyTicket();

        // Transfer to buyer2
        vm.prank(buyer1);
        ticketing.transferTicket(ticketId, buyer2);

        // buyer2 should be able to refund
        uint256 balanceBefore = buyer2.balance;
        vm.prank(buyer2);
        ticketing.requestRefund(ticketId);

        assertEq(buyer2.balance, balanceBefore + TICKET_PRICE);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTACKER CONTRACTS FOR REENTRANCY TESTING
// ═══════════════════════════════════════════════════════════════════════════════

/// @dev Malicious contract that attempts reentrancy on requestRefund
contract ReentrancyAttacker {
    EventTicketing private _ticketing;
    uint256 private _ticketId;
    uint256 private _attackCount;

    constructor(address ticketingAddr) {
        _ticketing = EventTicketing(payable(ticketingAddr));
    }

    function setTicketId(uint256 ticketId) external {
        _ticketId = ticketId;
    }

    function attack() external {
        _attackCount = 0;
        _ticketing.requestRefund(_ticketId);
    }

    receive() external payable {
        if (_attackCount < 3) {
            _attackCount++;
            _ticketing.requestRefund(_ticketId);
        }
    }
}

/// @dev Malicious contract that attempts reentrancy on withdrawEventFunds
contract WithdrawAttacker {
    EventTicketing private _ticketing;
    uint256 private _eventId;
    uint256 private _attackCount;

    constructor(address ticketingAddr) {
        _ticketing = EventTicketing(payable(ticketingAddr));
    }

    function setEventId(uint256 eventId) external {
        _eventId = eventId;
    }

    function attack() external {
        _attackCount = 0;
        _ticketing.withdrawEventFunds(_eventId);
    }

    receive() external payable {
        if (_attackCount < 3) {
            _attackCount++;
            _ticketing.withdrawEventFunds(_eventId);
        }
    }
}
