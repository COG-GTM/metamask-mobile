import Through, { type Through2Stream } from 'through2';
import ObjectMultiplex from '@metamask/object-multiplex';
import pump from 'pump';

/**
 * Returns a stream transform that parses JSON strings passing through
 * @returns the stream transform
 */
function jsonParseStream(): Through2Stream {
  return Through.obj(function (serialized, _, cb) {
    this.push(JSON.parse(String(serialized)));
    cb();
  });
}

/**
 * Returns a stream transform that calls {@code JSON.stringify}
 * on objects passing through
 * @returns the stream transform
 */
function jsonStringifyStream(): Through2Stream {
  return Through.obj(function (obj, _, cb) {
    this.push(JSON.stringify(obj));
    cb();
  });
}

/**
 * Sets up stream multiplexing for the given stream
 * @param connectionStream - the stream to mux
 * @returns the multiplexed stream
 */
function setupMultiplex(
  connectionStream: NodeJS.ReadWriteStream,
): ObjectMultiplex {
  const mux = new ObjectMultiplex();
  // ObjectMultiplex extends readable-stream's Duplex, whose types are not
  // resolvable here, so present it to pump as a Node duplex stream.
  pump(
    connectionStream,
    mux as unknown as NodeJS.ReadWriteStream,
    connectionStream,
    (err) => {
      if (err) {
        console.warn(err);
      }
    },
  );
  return mux;
}

export { jsonParseStream, jsonStringifyStream, setupMultiplex };
