import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <main>
      <h1>Unveiled Berlin — scaffold</h1>
    </main>,
    { title: "Unveiled Berlin — scaffold" },
  );
});
