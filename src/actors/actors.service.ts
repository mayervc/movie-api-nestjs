import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor } from './entities/actor.entity';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';

@Injectable()
export class ActorsService {
  constructor(
    @InjectRepository(Actor)
    private readonly actorRepository: Repository<Actor>
  ) {}

  async findOne(id: number): Promise<Actor> {
    const actor = await this.actorRepository.findOne({
      where: { id },
      relations: { cast: true }
    });
    if (!actor) {
      throw new NotFoundException(`Actor with ID ${id} not found`);
    }
    return actor;
  }

  async create(dto: CreateActorDto): Promise<Actor> {
    const actor = this.actorRepository.create(dto);
    return this.actorRepository.save(actor);
  }

  async update(id: number, dto: UpdateActorDto): Promise<Actor> {
    const actor = await this.findOne(id);
    Object.assign(actor, dto);
    return this.actorRepository.save(actor);
  }

  async remove(id: number): Promise<void> {
    const actor = await this.findOne(id);
    await this.actorRepository.remove(actor);
  }
}
