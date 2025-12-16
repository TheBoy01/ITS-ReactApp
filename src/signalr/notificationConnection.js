import * as signalR from "@microsoft/signalr";

export const createNotificationConnection = (token) => {
  return new signalR.HubConnectionBuilder()
    .withUrl("https://localhost:7100/notificationHub", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();
};
