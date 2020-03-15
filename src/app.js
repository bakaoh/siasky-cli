import * as mime from "mime";
import { HtmlParser } from "../parsers/text-html";
import { DefaultParser } from "../parsers/default";

const parsers = {
  "text/html": new HtmlParser(),
  "*": new DefaultParser()
};

function getParser(contentType = "*") {
  return parsers[contentType] || parsers["*"];
}

async function parseData(file, options) {
  if (!(await file.exists())) {
    throw new Error(`Failed to read file at path: ${file.getPath()}`);
  }

  const contentType =
    mime.getType(file.getPath()) || "application/octet-stream";

  const parser = getParser(contentType);

  const data = await parser.run(file, options);

  if (data.byteLength > 10 * 1024 * 1024) {
    throw new Error(
      `Detected byte size: ${File.bytesForHumans(
        data.byteLength
      )}\nData uploads are currently limited to 10MB per transaction.`
    );
  }

  return {
    data: data,
    parser: parser,
    contentType: contentType
  };
}
