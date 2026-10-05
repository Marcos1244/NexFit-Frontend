export default interface PaginationResultDto<T = unknown> {
  content: Array<T>;
  totalElements: number;
  totalPages: number;
  size: number;
  page: number;
}
