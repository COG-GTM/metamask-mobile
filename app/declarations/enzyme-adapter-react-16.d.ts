// `enzyme-adapter-react-16` is published without type declarations, so the
// small part of its public surface used by the test setup is declared here.
declare module 'enzyme-adapter-react-16' {
  import type { EnzymeAdapter } from 'enzyme';

  export default class Adapter extends EnzymeAdapter {}
}
