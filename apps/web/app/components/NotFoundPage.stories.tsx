import type { Story } from "@ladle/react";

import { NotFoundPage } from "./NotFoundPage";

export const German: Story = () => <NotFoundPage locale="de" />;
German.storyName = "NotFoundPage / German";

export const English: Story = () => <NotFoundPage locale="en" />;
English.storyName = "NotFoundPage / English";
