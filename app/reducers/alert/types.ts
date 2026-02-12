export interface AlertState {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: { msg: string } | null;
}
