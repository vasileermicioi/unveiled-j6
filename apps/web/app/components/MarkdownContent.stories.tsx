import type { Story } from "@ladle/react";

import MarkdownContent from "./MarkdownContent";

const FIXTURE = `## About this tour

A curated gallery walk with stops that reward slow looking.

- Four exhibition spaces
- Insight into artistic process
- Ends with a reflection on identity

More context: [Gallery Weekend Berlin](https://www.gallery-weekend-berlin.de/).

Regular paragraphs and **emphasis** stay readable.
`;

export const GfmFixture: Story = () => <MarkdownContent markdown={FIXTURE} />;
GfmFixture.storyName = "MarkdownContent / GFM fixture";
