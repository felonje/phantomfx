import { startEngine } from "./engine";
import { reloadInstruments } from "./instrumentCache";
import { priceFeed } from "./prices";

export async function startServices() {
  try {
    await reloadInstruments();
  } catch (err) {
    console.warn("[bootstrap] could not load instruments from DB (run `npm run setup`):", (err as Error).message);
  }
  priceFeed.start();
  startEngine();
  console.log(`[bootstrap] price feed: ${priceFeed.mode}, trading engine running`);
}
