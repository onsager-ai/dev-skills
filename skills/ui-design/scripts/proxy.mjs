// Node fetch in pen's headless CLI must use the inherited cloud proxy.
// Keep CA trust and TLS verification intact; this module handles no credentials.
import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici';
setGlobalDispatcher(new EnvHttpProxyAgent());
