import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TaskStatus } from '../../common/enums/domain.enums';

export class MoveTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;
}

