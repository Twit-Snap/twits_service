import app from './app';

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});
