import { Accordion, Paragraph, Surface } from "@heroui/react";
import { useEffect, useState } from "react";

export type FaqAccordionItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: readonly FaqAccordionItem[];
};

function FaqAccordionFallback({ items }: FaqAccordionProps) {
  return (
    <Surface className="faq-accordion faq-accordion--static" variant="transparent">
      {items.map((item, index) => {
        const isExpanded = index === 0;

        return (
          <Surface
            className={`faq-accordion__item${isExpanded ? " faq-accordion__item--expanded" : ""}`}
            key={item.question}
            variant="transparent"
          >
            <Paragraph className="faq-accordion__trigger">{item.question}</Paragraph>
            {isExpanded ? (
              <Surface className="faq-accordion__panel" variant="transparent">
                <Paragraph className="faq-accordion__answer">{item.answer}</Paragraph>
              </Surface>
            ) : null}
          </Surface>
        );
      })}
    </Surface>
  );
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <FaqAccordionFallback items={items} />;
  }

  return (
    <Accordion
      allowsMultipleExpanded={false}
      className="faq-accordion"
      defaultExpandedKeys={new Set(["0"])}
      hideSeparator
    >
      {items.map((item, index) => (
        <Accordion.Item id={String(index)} key={item.question}>
          <Accordion.Heading>
            <Accordion.Trigger>{item.question}</Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>
              <Paragraph>{item.answer}</Paragraph>
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
