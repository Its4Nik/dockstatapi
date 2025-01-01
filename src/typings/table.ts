type Table = {
  id: number; // Primary key, auto-incremented
  info: string; // Non-null text field
  timestamp: string; // ISO 8601 formatted datetime string
};

interface DataRow {
  info: string;
}

export { Table, DataRow };
