export default interface Invoice {
  fileHash: string;
  originalFileName: string;
  id: string;
  date: string;
  amount: number;
  isPaid: boolean;
  isReviewed: boolean;
  fileExists: boolean;
}
