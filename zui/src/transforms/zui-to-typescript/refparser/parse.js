import {
  ResolverError,
  ParserError,
  UnmatchedParserError,
  UnmatchedResolverError,
  isHandledError
} from './util/errors.js'
import * as plugins from './util/plugins.js'
import * as url from './util/url.js'

export default parse

/**
 * Reads and parses the specified file path or URL.
 *
 * @param {string} path - This path MUST already be resolved, since `read` doesn't know the resolution context
 * @param {$Refs} $refs
 * @param {$RefParserOptions} options
 *
 * @returns {Promise}
 * The promise resolves with the parsed file contents, NOT the raw (Buffer) contents.
 */
function parse(path, $refs, options) {
  // Remove the URL fragment, if any
  path = url.stripHash(path)

  // Add a new $Ref for this file, even though we don't have the value yet.
  // This ensures that we don't simultaneously read & parse the same file multiple times
  const $ref = $refs._add(path)

  // This "file object" will be passed to all resolvers and parsers.
  const file = {
    url: path,
    extension: url.getExtension(path)
  }

  // Read the file and then parse the data
  try {
    const resolver = readFile(file, options, $refs)
    $ref.pathType = resolver.plugin.name
    file.data = resolver.result

    const parser = parseFile(file, options, $refs)
    $ref.value = parser.result

    return parser.result
  } catch (err) {
    if (isHandledError(err)) {
      $ref.value = err
    }

    throw err
  }
}

/**
 * Reads the given file, using the configured resolver plugins
 *
 * @param {object} file           - An object containing information about the referenced file
 * @param {string} file.url       - The full URL of the referenced file
 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param {$RefParserOptions} options
 *
 * @returns {object}
 * The raw file contents and the resolver that was used.
 */
function readFile(file, options, $refs) {
  // Find the resolvers that can read this file
  let resolvers = plugins.all(options.resolve)
  resolvers = plugins.filter(resolvers, 'canRead', file)

  // Run the resolvers, in order, until one of them succeeds
  plugins.sort(resolvers)
  for (const resolver of resolvers) {
    try {
      const result = resolver.read(file, $refs)
      return {
        resolver,
        result
      }
    } catch (err) {
      if (!err && options.continueOnError) {
        // No resolver could be matched
        throw new UnmatchedResolverError(file.url)
      } else if (!err || !('error' in err)) {
        // Throw a generic, friendly error.
        throw new Error(`Unable to resolve $ref pointer "${file.url}"`)
      }
      // Throw the original error, if it's one of our own (user-friendly) errors.
      else if (err.error instanceof ResolverError) {
        throw err.error
      } else {
        throw new ResolverError(err, file.url)
      }
    }
  }
}

/**
 * Parses the given file's contents, using the configured parser plugins.
 *
 * @param {object} file           - An object containing information about the referenced file
 * @param {string} file.url       - The full URL of the referenced file
 * @param {string} file.extension - The lowercased file extension (e.g. ".txt", ".html", etc.)
 * @param {*}      file.data      - The file contents. This will be whatever data type was returned by the resolver
 * @param {$RefParserOptions} options
 *
 * @returns {object}
 * The parsed file contents and the parser that was used.
 */
function parseFile(file, options, $refs) {
  // Find the parsers that can read this file type.
  // If none of the parsers are an exact match for this file, then we'll try ALL of them.
  // This handles situations where the file IS a supported type, just with an unknown extension.
  const allParsers = plugins.all(options.parse)
  const filteredParsers = plugins.filter(allParsers, 'canParse', file)
  const parsers = filteredParsers.length > 0 ? filteredParsers : allParsers

  // Run the parsers, in order, until one of them succeeds
  plugins.sort(parsers)

  for (const parser of parsers) {
    const result = parser.parse(file, $refs)
    if (!parser.plugin.allowEmpty && isEmpty(result)) {
      throw new Error(`Error parsing "${file.url}" as ${parser.plugin.name}. \nParsed value is empty`)
    } else {
      return {
        parser,
        result
      }
    }
  }

  throw new Error(`Unable to parse ${file.url}`)
}

/**
 * Determines whether the parsed value is "empty".
 *
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return (
    value === undefined ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  )
}
