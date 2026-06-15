import { Test, TestingModule } from '@nestjs/testing';
import { PorteiroController } from './porteiro.controller';

describe('PorteiroController', () => {
  let controller: PorteiroController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PorteiroController],
    }).compile();

    controller = module.get<PorteiroController>(PorteiroController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
