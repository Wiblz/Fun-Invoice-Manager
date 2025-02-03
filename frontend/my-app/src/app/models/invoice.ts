export default interface Invoice {
  fileHash: string;
  originalFileName: string;
  id: string;
  date: string;
  amount: string;
  isPaid: boolean;
  isReviewed: boolean;
}
