#! /usr/bin/env node

let [,,delimiter] = process.argv;


if(!delimiter) {
    delimiter = ' ';
}

let input = '';

process.stdin.on('data', (chunk) => {
    input += chunk.toString();
});

process.stdin.on('end', () => {
    const lines = input.split(delimiter);
    lines.forEach((line) => {
        console.log(line);
    });
});

  process.stdin.resume();

process.stdin.on('error', (err) => {
    console.error('Error reading from stdin:', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});  