import type { Story } from "@ladle/react";

import { getGdprMemberCopy } from "../../lib/gdpr-content";
import { storyLocale } from "../stories/fixtures";
import { DataExportPage } from "./DataExportPage";

const copy = getGdprMemberCopy(storyLocale);

export const Default: Story = () => <DataExportPage copy={copy} locale={storyLocale} />;
Default.storyName = "DataExportPage / Default";
