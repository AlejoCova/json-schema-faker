import traverse from './traverse';
import random from './random';
import utils from './utils';

function isKey(prop: string): boolean {
  return prop === 'enum' || prop === 'default' || prop === 'required' || prop === 'definitions';
}

// TODO provide types
function run(schema: JsonSchema, container: Container) {
  try {
    return traverse(schema, [], function reduce(sub, maxReduceDepth) {
      if (typeof maxReduceDepth === 'undefined') {
        maxReduceDepth = random.number(1, 3);
      }

      if (!sub) {
        return null;
      }

      if (Array.isArray(sub.allOf)) {
        var schemas: JsonSchema[] = sub.allOf;

        delete sub.allOf;

        // this is the only case where all sub-schemas
        // must be resolved before any merge
        schemas.forEach(function(subSchema: JsonSchema) {
          utils.merge(sub, reduce(subSchema, maxReduceDepth + 1));
        });
      }

      if (Array.isArray(sub.oneOf || sub.anyOf)) {
        var key = sub.oneOf ? 'oneOf' : 'anyOf';
        var mix = sub.oneOf || sub.anyOf;

        delete sub.anyOf;
        delete sub.oneOf;

        return {
          thunk: () => random.pick(mix)
        };
      }

      for (var prop in sub) {
        if ((Array.isArray(sub[prop]) || typeof sub[prop] === 'object') && !isKey(prop)) {
          sub[prop] = reduce(sub[prop], maxReduceDepth);
        }
      }

      return container.wrap(sub);
    });
  } catch (e) {
    if (e.path) {
      throw new Error(e.message + ' in ' + '/' + e.path.join('/'));
    } else {
      throw e;
    }
  }
}

export default run;
