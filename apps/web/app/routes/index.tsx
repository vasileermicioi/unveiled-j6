import { Button, Card } from "@heroui/react";
import { createRoute } from "honox/factory";

export default createRoute((c) => {
  return c.render(
    <main className="p-8">
      <h1>Unveiled Berlin — scaffold</h1>
      <Card className="mt-6 max-w-md">
        <Card.Header>
          <Card.Title>Theme check</Card.Title>
          <Card.Description>HeroUI + brand tokens</Card.Description>
        </Card.Header>
        <Card.Content>
          <Button variant="primary">Primary CTA</Button>
        </Card.Content>
      </Card>
    </main>,
    { title: "Unveiled Berlin — scaffold" },
  );
});
