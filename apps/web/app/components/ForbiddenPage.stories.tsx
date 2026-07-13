import type { Story } from "@ladle/react";

import { ForbiddenPage } from "./ForbiddenPage";

export const German: Story = () => <ForbiddenPage locale="de" />;
German.storyName = "ForbiddenPage / German";

export const English: Story = () => <ForbiddenPage locale="en" />;
English.storyName = "ForbiddenPage / English";
