import { IAdaptiveCardResponse } from './adaptivecard';
import { AuthenticateResult } from './authentication';
import { IAutocompleteResponse } from './auto-complete';
import { IDevxAPI } from './devx-api';
import { IDimensions } from './dimensions';
import { Mode } from './enums';
import { IHistoryItem } from './history';
import { IScopes } from './permissions';
import { IUser } from './profile';
import { IGraphResponse } from './query-response';
import { IQuery, ISampleQuery } from './query-runner';
import { IResources, Collection } from './resources';
import { ISidebarProps } from './sidebar';
import { ISnippet } from './snippets';
import { IStatus } from './status';

export interface ApplicationState {
  theme: string;
  adaptiveCard: IAdaptiveCardResponse;
  graphExplorerMode?: Mode;
  profile: IUser | undefined | null;
  queryRunnerStatus?: IStatus | null;
  sampleQuery: IQuery;
  termsOfUse: boolean;
  sidebarProperties: ISidebarProps;
  auth: AuthenticateResult;
  samples: {
    queries: ISampleQuery[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  scopes: IScopes;
  history: IHistoryItem[];
  graphResponse: IGraphResponse;
  isLoadingData: boolean;
  snippets: ISnippet;
  responseAreaExpanded: boolean;
  dimensions: IDimensions;
  autoComplete: IAutocompleteResponse;
  devxApi: IDevxAPI;
  resources: IResources;
  collections?: Collection[];
}

export interface IApiFetch {
  pending: boolean;
  data: any[] | object | null | any;
  error: any | null;
}
