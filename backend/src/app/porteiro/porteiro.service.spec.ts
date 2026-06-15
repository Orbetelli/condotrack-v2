import { Test, TestingModule } from '@nestjs/testing';
import { PorteiroService } from './porteiro.service';

describe('PorteiroService', () => {
  let service: PorteiroService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PorteiroService],
    }).compile();

    service = module.get<PorteiroService>(PorteiroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
