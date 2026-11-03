import 'dotenv/config';
const { app } = await import('./app.js');
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`WaterSavers API running on http://localhost:${port}`));
