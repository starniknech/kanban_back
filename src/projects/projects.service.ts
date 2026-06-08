import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OWNER_ROLES } from '../common/auth/role-utils';
import { ProjectRole } from '../common/enums/domain.enums';
import { toObjectId } from '../common/utils/object-id';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { Project } from './projects.model';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    private readonly userProjectsService: UserProjectsService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(userId: string, data: { name: string; description?: string }) {
    const project = await this.projectModel.create({
      ...data,
      ownerId: toObjectId(userId),
    });

    await this.userProjectsService.createMembership(userId, project.id, OWNER_ROLES);

    return project;
  }

  async listForUser(userId: string) {
    const projectIds = await this.userProjectsService.listProjectIdsForUser(userId);

    if (!projectIds.length) {
      return [];
    }

    return this.projectModel.find({ _id: { $in: projectIds }, deletedAt: null }).exec();
  }

  async findById(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);

    const project = await this.projectModel.findById(toObjectId(projectId)).exec();

    if (!project || project.deletedAt) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(userId: string, projectId: string, data: { name?: string; description?: string }) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.ADMIN);

    const project = await this.projectModel.findByIdAndUpdate(toObjectId(projectId), data, { new: true }).exec();

    if (project) {
      this.realtimeGateway.emitProjectUpdated(projectId, project);

      if (data.name !== undefined) {
        this.realtimeGateway.emitProjectRenamed(projectId, project);
      }
    }

    return project;
  }

  async delete(userId: string, projectId: string) {
    await this.userProjectsService.requireRole(userId, projectId, ProjectRole.OWNER);

    const project = await this.projectModel
      .findByIdAndUpdate(toObjectId(projectId), { deletedAt: new Date() }, { new: true })
      .exec();

    this.realtimeGateway.emitProjectDeleted(projectId, project);

    return project;
  }

  async listMembers(userId: string, projectId: string) {
    await this.userProjectsService.requireMember(userId, projectId);
    return this.userProjectsService.listProjectMembers(projectId);
  }

  async updateMemberRoles(ownerId: string, projectId: string, memberId: string, role: ProjectRole[]) {
    const member = await this.userProjectsService.updateRoles(ownerId, projectId, memberId, role);

    this.realtimeGateway.emitParticipantRolesUpdated(projectId, member);

    return member;
  }

  async removeMember(ownerId: string, projectId: string, memberId: string) {
    const member = await this.userProjectsService.removeMember(ownerId, projectId, memberId);

    await this.realtimeGateway.emitParticipantRemoved(projectId, memberId, member);

    return member;
  }
}
