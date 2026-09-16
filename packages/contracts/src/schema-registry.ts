import job from '../schemas/opengeo-job.v1.schema.json' with {type:'json'};
import observation from '../schemas/opengeo-observation.v1.schema.json' with {type:'json'};
import prompt from '../schemas/opengeo-prompt.v1.schema.json' with {type:'json'};
import publication from '../schemas/opengeo-publication.v1.schema.json' with {type:'json'};
import capability from '../schemas/opengeo-capability.v1.schema.json' with {type:'json'};
import metricResult from '../schemas/opengeo-metric-result.v1.schema.json' with {type:'json'};
export const schemaRegistry={job,observation,prompt,publication,capability,metricResult} as const;
export type ContractSchema = Record<string, unknown>;
