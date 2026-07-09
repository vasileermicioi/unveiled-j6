import { Alert } from "@heroui/react";

type AdminFormErrorProps = {
  message: string;
};

/** SSR form-level error banner for admin create/edit/delete pages. */
export function AdminFormError({ message }: AdminFormErrorProps) {
  return (
    <Alert status="danger">
      <Alert.Content>
        <Alert.Title>{message}</Alert.Title>
      </Alert.Content>
    </Alert>
  );
}
