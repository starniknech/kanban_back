import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OWNER_ROLES,
} from '../common/auth/role-utils';
import {
  ProjectRole,
  RealtimeEvent,
} from '../common/enums/domain.enums';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { Project } from './projects.model';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly userProjectsService: UserProjectsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(userId: string, data: { name: string; description?: string }) {
    const project = await this.projectModel.create({
      ...data,
      ownerId: new Types.ObjectId(userId),
    });

    await this.userProjectsService.createMembership(
      userId,
      project.id,
      OWNER_ROLES,
    );

    return project;
  }

  async listForUser(userId: string) {
    const projectIds =
      await this.userProjectsService.listProjectIdsForUser(userId);

    if (!projectIds.length) {
      return [];
    }

    return this.projectModel
      .find({ _id: { $in: projectIds }, deletedAt: null })
      .exec();
  }

  async findById(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);

    const project = await this.projectModel
      .findById(new Types.ObjectId(projectId))
      .exec();

    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    userId: string,
    projectId: string,
    data: { name?: string; description?: string },
  ) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    return this.projectModel
      .findByIdAndUpdate(new Types.ObjectId(projectId), data, { new: true })
      .exec();
  }

  async delete(userId: string, projectId: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.OWNER);

    return this.projectModel
      .findByIdAndUpdate(
        new Types.ObjectId(projectId),
        { deletedAt: new Date() },
        { new: true },
      )
      .exec();
  }

  async listMembers(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.userProjectsService.listProjectMembers(projectId);
  }

  async updateMemberRoles(
    ownerId: string,
    projectId: string,
    memberId: string,
    role: ProjectRole[],
  ) {
    const member = await this.userProjectsService.updateRoles(
      ownerId,
      projectId,
      memberId,
      role,
    );

    this.realtimeGateway.emitToProject(
      projectId,
      RealtimeEvent.PARTICIPANT_ROLES_UPDATED,
      member,
    );

    return member;
  }

  async removeMember(ownerId: string, projectId: string, memberId: string) {
    return this.userProjectsService.removeMember(ownerId, projectId, memberId);
  }

}
