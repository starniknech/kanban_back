import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { hasProjectRole, normalizeProjectRoles } from '../common/auth/role-utils';
import { ProjectRole } from '../common/enums/domain.enums';
import { toObjectId } from '../common/utils/object-id';
import { UserProject } from './user-projects.model';

@Injectable()
export class UserProjectsService {
  constructor(
    @InjectModel(UserProject.name)
    private readonly userProjectModel: Model<UserProject>,
  ) {}

  async createMembership(userId: string, projectId: string, role: ProjectRole[]): Promise<UserProject> {
    return this.userProjectModel.create({
      userId: toObjectId(userId),
      projectId: toObjectId(projectId),
      role: normalizeProjectRoles(role),
    });
  }

  async findMembership(userId: string, projectId: string): Promise<UserProject | null> {
    return this.userProjectModel
      .findOne({
        userId: toObjectId(userId),
        projectId: toObjectId(projectId),
      })
      .exec();
  }

  async listProjectMembers(projectId: string): Promise<UserProject[]> {
    return this.userProjectModel
      .find({ projectId: toObjectId(projectId) })
      .populate('userId', 'name email avatar')
      .exec();
  }

  async listProjectIdsForUser(userId: string): Promise<Types.ObjectId[]> {
    const memberships = await this.userProjectModel
      .find({ userId: toObjectId(userId) })
      .select('projectId')
      .exec();

    return memberships.map((membership) => membership.projectId);
  }

  async requireMember(userId: string, projectId: string): Promise<UserProject> {
    const membership = await this.findMembership(userId, projectId);

    if (!membership) {
      throw new ForbiddenException('You are not a project participant');
    }

    return membership;
  }

  async requireRole(userId: string, projectId: string, role: ProjectRole): Promise<UserProject> {
    const membership = await this.requireMember(userId, projectId);

    if (!hasProjectRole(membership.role, role)) {
      throw new ForbiddenException(`Project ${role} role is required`);
    }

    return membership;
  }

  async updateRoles(ownerId: string, projectId: string, memberId: string, role: ProjectRole[]): Promise<UserProject> {
    await this.requireRole(ownerId, projectId, ProjectRole.OWNER);

    const normalizedRoles = normalizeProjectRoles(role);

    if (normalizedRoles.includes(ProjectRole.OWNER) && ownerId !== memberId) {
      throw new ForbiddenException('Owner role cannot be transferred here');
    }

    const updated = await this.userProjectModel
      .findOneAndUpdate(
        {
          userId: toObjectId(memberId),
          projectId: toObjectId(projectId),
        },
        { role: normalizedRoles },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Project participant not found');
    }

    return updated;
  }

  async removeMember(ownerId: string, projectId: string, memberId: string): Promise<UserProject | null> {
    await this.requireRole(ownerId, projectId, ProjectRole.OWNER);

    if (ownerId === memberId) {
      throw new ForbiddenException('Owner cannot remove themselves');
    }

    return this.userProjectModel
      .findOneAndDelete({
        userId: toObjectId(memberId),
        projectId: toObjectId(projectId),
      })
      .exec();
  }
}
