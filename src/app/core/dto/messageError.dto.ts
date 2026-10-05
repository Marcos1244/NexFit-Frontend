export default interface MessageError {
  timestamp: Date;
  status: number;
  error: string;
  message: string;
  path: string;

  validationErrors?: Map<string, string>
}
