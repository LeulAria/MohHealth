'use client';

import { type Value, TrailingBlockPlugin } from 'platejs';
import { type TPlateEditor } from 'platejs/react';

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { BlockPlaceholderKit } from '@/components/editor/plugins/block-placeholder-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { TableKit } from '@/components/editor/plugins/table-kit';
import { MediaKit } from '@/components/editor/plugins/media-kit';
import { AlignKit } from '@/components/editor/plugins/align-kit';
import { FontKit } from '@/components/editor/plugins/font-kit';
import { LineHeightKit } from '@/components/editor/plugins/line-height-kit';

// Read-only editor kit without toolbars or editing features
export const ReadOnlyEditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...MediaKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,
  ...FontKit,

  // Block Style
  ...ListKit,
  ...AlignKit,
  ...LineHeightKit,

  // UI (only placeholder, no toolbars)
  ...BlockPlaceholderKit,
  TrailingBlockPlugin,
];

export type ReadOnlyEditor = TPlateEditor<Value, (typeof ReadOnlyEditorKit)[number]>;

