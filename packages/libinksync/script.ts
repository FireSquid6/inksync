const fp = "/home/firesquid/source/inksync/packages/libinksync/testdir/test-vault2/students/jdeiss/information.json"

const file = Bun.file(fp);
console.log(await file.text());

