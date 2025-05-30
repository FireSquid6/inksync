import { Directory } from "@capacitor/filesystem";
import { MobileFilesystem } from "../lib/filesystem";
import { useState } from "react";

export function TestComponent() {
  const [url, setUrl] = useState<string>("");
  const onClick = async () => {
    console.log("click function called");
    try {
      const filesystem = new MobileFilesystem("MyCoolDirectory", Directory.Documents);
      console.log("made the filesystem");

      await filesystem.writeTo("myFile.txt", "Hello, world! This was writting from typescript!");

    } catch (e) {
      if (e instanceof Error) {
        console.log("Caught handleable error");
        console.log(e.name);
        console.log(e.message);
        console.log(e.stack);
        console.log(e.cause);
      } else {
        console.log("Caught unhandleable error");
        console.log(e);
      }
    }
  }

  const fetcher = async () => {
    try {
      const result = await fetch(url);
      console.log(result);
    } catch (e) {
      console.log("error:");
      console.log(e);
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={onClick}>
        Do thing
      </button>
      <button className="btn btn-accent" onClick={fetcher}>
        Fetch
      </button>
      <input value={url} onChange={(e) => setUrl(e.target.value)} className="input input-md" />
    </>
  )
}
