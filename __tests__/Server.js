const grpc = require("grpc");
const path = require("path");
const protoLoader = require("@grpc/proto-loader");

const { Server } = require("../index");
var PROTO_PATH = path.join(__dirname, "./test.proto");

var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

var protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
// console.log(Object.keys(protoDescriptor));
var testProto = protoDescriptor.test;

const testService = testProto.Test;

describe("Unit tests for Server", () => {
  xit("Constructor extends the grpc server class.", () => {
    const server = new Server();
    expect(server instanceof grpc.Server).toBeTruthy();
  });

  xit("Server bind throws an error when you pass in an object as a port.", () => {
    expect(() => {
      const server = new Server();
      server.bind({ port: "0.0.0.0:3000" });
    }).toThrow();
  });

  xit("addService composes and adds an async function.", () => {
    const server = new Server();
    server.addService(testService, {
      unaryCall: jest.fn(function() {})
    });
    expect(
      server.handlers[Object.keys(server.handlers)[0]].func.constructor.name
    ).toBe("AsyncFunction");
  });

  xit("addService throws an error when you add a handlername not included in the service.", () => {
    const server = new Server();
    expect(() => {
      server.addService(testService, {
        unaryCatz: jest.fn(function() {})
      });
    }).toThrow();
  });

  xit("addService composes a service level middleware function that gets called when you call the handler.", () => {
    const server = new Server();
    const mockMiddleware = jest.fn(function() {});
    server.addService(
      testService,
      {
        unaryCall: jest.fn(function() {})
      },
      mockMiddleware
    );
    const fakeObject = {};
    console.log(
      server.handlers[Object.keys(server.handlers)[0]].func(fakeObject)
    );
    expect(mockMiddleware.mock.calls.length).toBe(1);
  });

  xit("addService composes a method level middleware that is called on context object when handler is called.", () => {
    const server = new Server();
    const mockMiddleware = jest.fn();
    server.addService(testService, {
      unaryCall: [mockMiddleware]
    });
    const fakeObject = {};
    console.log(
      server.handlers[Object.keys(server.handlers)[0]].func(fakeObject)
    );
    expect(mockMiddleware.mock.calls.length).toBe(1);
  });
});

describe("Uncaught Error Handling.", () => {
  xit("Server level error handling should receive error and context object", () => {
    const mockErrorHandler = jest.fn();
    const server = new Server(mockErrorHandler);
    const mockMiddleware = jest.fn((err, call) => {
      throw new Error("error from mock middleware");
    });
    server.addService(testService, {
      unaryCall: [mockMiddleware]
    });
    const fakeObject = {};
    server.handlers[Object.keys(server.handlers)[0]].func(fakeObject);
    expect(mockErrorHandler.mock.calls.length).toBe(1);
    expect(mockErrorHandler.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(typeof mockErrorHandler.mock.calls[0][1] === "object").toBeTruthy();
  });

  it("Service level error handlers overwrite server level error handlers", () => {
    const mockErrorHandler = jest.fn();
    const server = new Server(jest.fn());
    const mockMiddleware = jest.fn((err, call) => {
      throw new Error("error from mock middleware");
    });
    server.addService(
      testService,
      {
        unaryCall: [mockMiddleware]
      },
      null,
      mockErrorHandler
    );
    const fakeObject = {};
    server.handlers[Object.keys(server.handlers)[0]].func(fakeObject);
    expect(mockErrorHandler.mock.calls.length).toBe(1);
    expect(mockErrorHandler.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(typeof mockErrorHandler.mock.calls[0][1] === "object").toBeTruthy();
  });
});
