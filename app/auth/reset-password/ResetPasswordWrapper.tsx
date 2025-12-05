"use client";

import { ResetPasswordClient } from "@igorchugurov/auth-sdk/components";

/**
 * Клиентская обертка для ResetPasswordClient
 */
export function ResetPasswordWrapper() {
  return (
    <ResetPasswordClient
      onPasswordUpdated={async () => {
        // Callback после успешного обновления пароля
        // Можно добавить дополнительную логику при необходимости
      }}
    />
  );
}
