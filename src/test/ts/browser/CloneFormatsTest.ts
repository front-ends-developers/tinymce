import { assert, UnitTest } from '@ephox/bedrock';
import { document } from '@ephox/dom-globals';
import { Fun, Option } from '@ephox/katamari';
import { Element, Html, Insert } from '@ephox/sugar';
import TableFill from 'ephox/snooker/api/TableFill';

UnitTest.test('CloneFormatsTest', function () {
  const doc = document;
  const cloneFormats = Option.none();
  const noCloneFormats = Option.some([]);
  const cloneTableFill = TableFill.cellOperations(Fun.noop, doc, cloneFormats);
  const noCloneTableFill = TableFill.cellOperations(Fun.noop, doc, noCloneFormats);

  const cellElement = Element.fromTag('td');
  const cellContent = Element.fromHtml('<strong contenteditable="false"><em>stuff</em></strong>');
  Insert.append(cellElement, cellContent);
  const cell = {
    element: Fun.constant(cellElement),
    colspan: Fun.constant(1)
  };

  const clonedCell = cloneTableFill.cell(cell);

  assert.eq('<td><strong><em><br></em></strong></td>', Html.getOuter(clonedCell));

  const noClonedCell = noCloneTableFill.cell(cell);
  assert.eq('<td><br></td>', Html.getOuter(noClonedCell));
});
