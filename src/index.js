#!/usr/bin/env node

import fs from 'fs';
import { inlineSource } from 'inline-source';
import yargs from 'yargs';
import axios from 'axios';
import FormData from 'form-data';

// siasky-cli in.html [out.html]

let argv = yargs
  .usage(`Usage: $0 [--deploy] in.html [out.html]`)
  .help()
  .boolean('deploy')
  .alias('d', 'deploy')
  .alias('h', 'help').argv;

let source = argv._[0];

// pass "-" to read from stdin
if (source === '-' || !source) {
  source = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('readable', () => {
    let chunk = process.stdin.read();
    if (chunk !== null) source += chunk;
  });
  process.stdin.on('end', () => {
    run(source, argv);
  });
} else {
  run(source, argv);
}

function uploadFile(path) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(path), {});

  return new Promise((resolve, reject) => {
    axios
      .post('https://siasky.net/skynet/skyfile', formData, {
        headers: formData.getHeaders()
      })
      .then((resp) => {
        resolve(`sia://${resp.data.skylink}`);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function run(source, argv) {
  try {
    const html = await inlineSource(source, {
      attribute: false,
      compress: true,
      rootpath: process.cwd(),
      saveRemote: false,
      svgAsImage: true,
      swallowErrors: true,
      ignore: [],
      handlers: [
        async (source, context) => {
          if (!source.errors) {
            source.errors = [];
          }
          if (!source.subResources) {
            source.subResources = [];
          }
        }
      ]
    });
    let out = `siasky-${Math.floor(Math.random() * Math.floor(100000))}.html`;
    fs.writeFileSync(out, html);
    const link = await uploadFile(out);
    process.stdout.write(link + '\n');
    fs.unlinkSync(out);
  } catch (err) {
    process.stderr.write(`Error: ${err}\n`);
    return process.exit(1);
  }
}
