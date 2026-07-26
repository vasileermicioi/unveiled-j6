import { Accordion, Paragraph, Surface } from "@heroui/react";
import { useEffect, useState } from "react";

export type FaqAccordionItem = {
  question: string;
  /** Single answer, or multiple paragraphs (legal pages). */
  answer: string | readonly string[];
};

type FaqAccordionProps = {
  items: readonly FaqAccordionItem[];
};

function answerParagraphs(answer: string | readonly string[]): string[] {
  return typeof answer === "string" ? [answer] : [...answer];
}

function AnswerBody({ answer }: { answer: string | readonly string[] }) {
  const paragraphs = answerParagraphs(answer);
  if (paragraphs.length === 1) {
    return <Paragraph>{paragraphs[0]}</Paragraph>;
  }
  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {paragraphs.map((paragraph) => (
        <Paragraph key={paragraph}>{paragraph}</Paragraph>
      ))}
    </Surface>
  );
}

function FaqAccordionFallback({ items }: FaqAccordionProps) {
  return (
    <Surface className="faq-accordion faq-accordion--static" variant="transparent">
      {items.map((item, index) => {
        const isExpanded = index === 0;
        const paragraphs = answerParagraphs(item.answer);

        return (
          <Surface
            className={`faq-accordion__item${isExpanded ? " faq-accordion__item--expanded" : ""}`}
            key={item.question}
            variant="transparent"
          >
            <Paragraph className="faq-accordion__trigger">{item.question}</Paragraph>
            {isExpanded ? (
              <Surface className="faq-accordion__panel" variant="transparent">
                {paragraphs.length === 1 ? (
                  <Paragraph className="faq-accordion__answer">{paragraphs[0]}</Paragraph>
                ) : (
                  <Surface
                    className="faq-accordion__answer flex flex-col gap-3"
                    variant="transparent"
                  >
                    {paragraphs.map((paragraph) => (
                      <Paragraph key={paragraph}>{paragraph}</Paragraph>
                    ))}
                  </Surface>
                )}
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
              <AnswerBody answer={item.answer} />
            </Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
