import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theme } from '../../entities/project/theme.entity';
import { ThemeController } from './theme.controller';
import { ThemeService } from './theme.service';
import { Component } from 'src/entities/project/component.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Theme, Component])],
  controllers: [ThemeController],
  providers: [ThemeService],
  exports: [ThemeService],
})
export class ThemeModule {}
