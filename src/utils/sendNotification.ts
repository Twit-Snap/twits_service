/* istanbul ignore file */
export const sendPushNotification = async (
  expoPushToken: string,
  title: string,
  body: string,
  data: object = {},
  sound: string = 'default'
) => {
  const message = {
    to: expoPushToken,
    sound: sound,
    title: title,
    body: body,
    data: data
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      host: 'exp.host',
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  }).then(response => {
    if (response.ok) {
      console.log('notification sent!');
    }
  });
};
