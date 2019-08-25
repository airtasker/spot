declare function decoratorPlain(target: any): void;

function decoratorFactoryNotConfig(param: string) {
  return (target: any) => {};
}

function decoratorFactoryConfig(config: Config) {
  return (target: any) => {};
}

interface Config {
  testParam: string;
}

@decoratorPlain
class DecoratorPlain {}

@decoratorFactoryNotConfig("test")
class DecoratorFactoryNotConfig {}

@decoratorFactoryConfig({ testParam: "test" })
class DecoratorFactoryConfig {}
