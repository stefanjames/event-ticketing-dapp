import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers';
import ABI from '../abi/EventTicketing.json';
import { CONTRACT_ADDRESS } from './constants';

export function getContract(signerOrProvider: JsonRpcSigner | BrowserProvider): Contract {
  return new Contract(CONTRACT_ADDRESS, ABI, signerOrProvider);
}

export function parseContractError(error: unknown): string {
  const err = error as { reason?: string; message?: string; data?: string; info?: { error?: { message?: string } } };

  if (err.reason) {
    if (err.reason.includes('EventDoesNotExist')) return 'Event does not exist.';
    if (err.reason.includes('TicketDoesNotExist')) return 'Ticket does not exist.';
    if (err.reason.includes('NotOrganizer')) return 'Only the event organizer can perform this action.';
    if (err.reason.includes('NotTicketOwner')) return 'You are not the owner of this ticket.';
    if (err.reason.includes('EventNotActive')) return 'This event is not active.';
    if (err.reason.includes('EmptyString')) return 'Required field cannot be empty.';
    if (err.reason.includes('ZeroAddress')) return 'Cannot use zero address.';
    if (err.reason.includes('InvalidDate')) return 'Event date must be in the future.';
    if (err.reason.includes('ZeroPrice')) return 'Ticket price must be greater than zero.';
    if (err.reason.includes('ZeroTickets')) return 'Must have at least one ticket.';
    if (err.reason.includes('ZeroQuantity')) return 'Quantity must be at least 1.';
    if (err.reason.includes('ExceedsMaxPerPurchase')) return 'Maximum 10 tickets per purchase.';
    if (err.reason.includes('SoldOut')) return 'Not enough tickets available.';
    if (err.reason.includes('IncorrectPayment')) return 'Incorrect ETH amount sent.';
    if (err.reason.includes('RefundDeadlinePassed')) return 'Refund deadline has passed.';
    if (err.reason.includes('TicketNotValid')) return 'Ticket is no longer valid.';
    if (err.reason.includes('EventNotEnded')) return 'Event has not ended yet.';
    if (err.reason.includes('NoFundsToWithdraw')) return 'No funds available to withdraw.';
    if (err.reason.includes('TransferToSelf')) return 'Cannot transfer ticket to yourself.';
    if (err.reason.includes('ETHTransferFailed')) return 'ETH transfer failed.';
    if (err.reason.includes('EnforcedPause')) return 'Contract is currently paused.';
    return err.reason;
  }

  const msg = err.info?.error?.message || err.message || '';
  if (msg.includes('user rejected')) return 'Transaction cancelled by user.';
  if (msg.includes('insufficient funds')) return 'Insufficient ETH balance.';
  return msg || 'An unexpected error occurred.';
}

export { ABI };
