export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startServices } = await import("./server/bootstrap");
    await startServices();
  }
}
