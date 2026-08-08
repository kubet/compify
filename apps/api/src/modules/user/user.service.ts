import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthCredentialsDto } from '../../models/user/auth-credentials.dto';
import { SignUpDto } from '../../models/user/signup.dto';
import { VerifyAccountDto } from 'src/models/user/verify-account.dto';
import { User } from 'src/entities/user/user.entity';
import { ChangePasswordDto } from 'src/models/user/change-password.dto';
import { Token, TokenType } from 'src/entities/user/token.entity';
import { JwtPayload } from 'src/common/jwt-payload.interface';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription/subscription.entity';
import {
  BillingCycle,
  SubscriptionPlan,
} from 'src/entities/subscription/subscription-plan.entity';
import { EmailService } from '../email/email.service';
import { Newsletter } from 'src/entities/newsletter/newsletter.entity';
import { CreateNewsletterDto } from 'src/models/newsletter/create-newsletter.dto';
import { Component } from 'src/entities/project/component.entity';
import { MinioClientService } from '../minio/minio.service';
import { uuidToShortId } from 'src/common/short-id';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChangeNameDto } from 'src/models/user/change-name.dto';
import { Theme } from 'src/entities/project/theme.entity';
import { Upvote } from 'src/entities/project/upvote.entity';
import { Report } from 'src/entities/common/report.entity';
import { UserUsedComponents } from 'src/entities/user/user-used-components.entity';
import { In } from 'typeorm';
import {
  generateEmailTemplate,
  generatePasswordResetTemplate,
} from 'src/common/email-templates';

const DUMMY_PASSWORD_HASH =
  '$2b$10$uNaF.1yM.EwUFQQU0MZnDeuGXx6FAmcVKV9GHEy7BbB1iXXdCQ4vq';

@Injectable()
export class UserService {
  private blockedDomains: Set<string>;

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Token) private tokenRepo: Repository<Token>,
    @InjectRepository(Subscription)
    private subscriptionRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepo: Repository<SubscriptionPlan>,
    private readonly emailService: EmailService,
    @InjectRepository(Newsletter)
    private newsletterRepo: Repository<Newsletter>,
    @InjectRepository(Component)
    private compRepo: Repository<Component>,
    private minioService: MinioClientService,
    @InjectRepository(CliToken)
    private cliTokenRepo: Repository<CliToken>,
    @InjectRepository(Theme)
    private themeRepo: Repository<Theme>,
    @InjectRepository(Upvote)
    private upvoteRepo: Repository<Upvote>,
    @InjectRepository(Report)
    private reportRepo: Repository<Report>,
    @InjectRepository(UserUsedComponents)
    private userUsedComponentsRepo: Repository<UserUsedComponents>,
  ) {
    this.initializeBlockedDomains();
  }

  private initializeBlockedDomains(): void {
    try {
      const domainsFile = readFileSync(
        join(process.cwd(), 'blocked_domains.txt'),
        'utf8',
      );
      this.blockedDomains = new Set(
        domainsFile
          .split('\n')
          .map((domain) => domain.trim().toLowerCase())
          .filter(Boolean),
      );
    } catch {
      // Optional for self-hosts; an absent list disables domain blocking.
      this.blockedDomains = new Set();
    }
  }

  private isBlockedDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? this.blockedDomains.has(domain) : false;
  }

  async subscribeToNewsletter(createNewsletterDto: CreateNewsletterDto) {
    return await this.newsletterRepo.save(createNewsletterDto);
  }

  async changeName(b: ChangeNameDto, user: User) {
    user.firstName = b.firstName;
    user.lastName = b.lastName;
    if (b?.username) {
      await this.checkIfUsernameIsAvailable(b.username);
      user.username = b.username;
    }
    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      email: saved.email,
      firstName: saved.firstName,
      lastName: saved.lastName,
      username: saved.username,
      valid: saved.valid,
    };
  }

  async refreshToken(user: User) {
    const accessToken = await this.getAccessToken({
      id: user.id,
      plan: await this.getUserSubscriptionPlan(user),
      sessionVersion: user.sessionVersion,
    });
    return { accessToken };
  }

  private hashCliToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async generateCliToken(user: User) {
    const newToken = `cli_${crypto.randomBytes(32).toString('hex')}`;
    const storedToken = this.hashCliToken(newToken);
    const existingToken = await this.cliTokenRepo.findOneBy({
      user: { id: user.id },
    });

    if (existingToken) {
      existingToken.token = storedToken;
      existingToken.lastUsedAt = new Date();
      await this.cliTokenRepo.save(existingToken);
    } else {
      await this.cliTokenRepo.save({
        user: { id: user.id },
        token: storedToken,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      });
    }

    // This is the only response that exposes the bearer token.
    return { token: newToken };
  }

  async getCliToken(user: User) {
    const token = await this.cliTokenRepo.findOneBy({ user: { id: user.id } });
    return { exists: Boolean(token), lastUsedAt: token?.lastUsedAt || null };
  }

  async revokeCliToken(user: User) {
    await this.cliTokenRepo.delete({
      user: { id: user.id },
    });
  }

  async getUserSubscriptions(user: User, show: string) {
    const items = await this.subscriptionPlanRepo
      .createQueryBuilder('plan')
      .where('plan.isFeatured = true AND plan.isAvailable = true')
      .select([
        'plan.id as id',
        'plan.name as name',
        'plan."bestFor" as "bestFor"',
        'plan.price as price',
        'plan."promoData" as "promoData"',
        'plan.features as features',
        'plan.colors as colors',
        'plan.level as level',
        'plan."billingCycle" as "billingCycle"',
        'plan.stripePriceId as "stripePriceId"',
      ])
      .orderBy('plan.price', 'ASC')
      .getRawMany();

    if (show === 'all') {
      const data = {
        annually: items.filter(
          (item) => item.billingCycle !== BillingCycle.MONTHLY,
        ),
        monthly: items.filter(
          (item) => item.billingCycle !== BillingCycle.ANNUALLY,
        ),
      };
      return data;
    }

    const activeSubscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .where('subscription.userId = :user', { user: user.id })
      .leftJoinAndSelect('subscription.plan', 'plan')
      .select([
        'subscription.id as id',
        'subscription.status as status',
        'subscription."endDate" as "endDate"',
        'subscription."startDate" as "startDate"',
        'plan.id as "planId"',
        'plan.level as "level"',
        'plan.price as "price"',
        'plan."promoData" as "promoData"',
        'plan.name as "name"',
        'plan.billingCycle as "billingCycle"',
      ])
      .orderBy('subscription.createdAt', 'DESC')
      .getRawOne();

    let filteredItems = items.filter((item) => item.price > 0);

    if (activeSubscription) {
      filteredItems = filteredItems.filter(
        (item) => item.level >= activeSubscription.level,
      );
    }
    filteredItems = filteredItems.map((item) => ({
      ...item,
      current: activeSubscription?.planId === item.id,
    }));

    const data = {
      // annually: filteredItems.filter(
      //   (item) => item.billingCycle !== BillingCycle.MONTHLY,
      // ),
      monthly:
        activeSubscription?.billingCycle === BillingCycle.ANNUALLY
          ? []
          : filteredItems.filter(
              (item) => item.billingCycle !== BillingCycle.ANNUALLY,
            ),
      currentPlan: {
        ...activeSubscription,
        endDate: activeSubscription?.endDate,
        status: activeSubscription?.status,
      },
    };
    return data;
  }

  async getAllSubscriptions() {
    const items = await this.subscriptionPlanRepo
      .createQueryBuilder('plan')
      .where('plan.isFeatured = true AND plan.isAvailable = true')
      .select([
        'plan.id as id',
        'plan.name as name',
        'plan."bestFor" as "bestFor"',
        'plan.price as price',
        'plan.features as features',
        'plan."promoData" as "promoData"',
        'plan.colors as colors',
        'plan.level as level',
        'plan."billingCycle" as "billingCycle"',
      ])
      .orderBy('plan.price', 'ASC')
      .getRawMany();

    const data = {
      // annually: items.filter(
      //   (item) => item.billingCycle !== BillingCycle.MONTHLY,
      // ),
      monthly: items.filter(
        (item) => item.billingCycle !== BillingCycle.ANNUALLY,
      ),
    };
    return data;
  }

  async setLanguagePreference(body: any, user: User) {
    const { languages } = body;
    const validLanguages = [
      'react',
      'react-ts',
      'vue',
      'vue-ts',
      'nextjs',
      'nextjs-ts',
      'react-native',
      'react-native-ts',
      'static',
    ];

    // Ensure languages is an array
    if (!Array.isArray(languages)) {
      throw new BadRequestException('Languages must be an array');
    }

    // Validate each language in the array
    for (const language of languages) {
      if (!validLanguages.includes(language)) {
        throw new BadRequestException(
          `Invalid language preference: ${language}`,
        );
      }
    }

    user.languagePreferences = languages;
    await this.userRepo.save(user);
    return { message: 'Language preferences updated' };
  }

  async getSubscription(user: User) {
    const subscription = await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .where('subscription.userId = :user', { user: user.id })
      .leftJoinAndSelect('subscription.plan', 'plan')
      .orderBy('subscription.createdAt', 'DESC')
      .select([
        'subscription.id as id',
        'subscription.status as status',
        'subscription.createdAt as "createdAt"',
        'plan.id as "planId"',
        'plan.fromCredits as "fromCredits"',
        'plan.colors as "colors"',
        'plan.toCredits as "toCredits"',
        'plan.toAiCredits as "toAiCredits"',
        'plan.name as "planName"',
        'plan.price as "planPrice"',
        'plan.level as "planLevel"',
        'subscription."endDate" as "endDate"',
      ])
      .getRawOne();
    const usage = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user.id })
      .select('user.availableCredits', 'availableCredits')
      .addSelect('user.availableAiCredits', 'availableAiCredits')
      .addSelect('user.availableFreeAiCredits', 'availableFreeAiCredits')
      .getRawOne();

    return {
      subscription,
      usage,
    };
  }

  async changeInfo(
    firstName: string,
    lastName: string,
    password: string,
    user: User,
  ) {
    const userf = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: user.email })
      .getOne();
    if (!userf?.password) {
      throw new ForbiddenException('Current password is incorrect');
    }
    const isMatch = await bcrypt.compare(password, userf.password);
    if (!isMatch) {
      throw new ForbiddenException('Current password is incorrect');
    }

    return await this.userRepo.save(userf);
  }

  async changePassword(b: ChangePasswordDto, user: User) {
    const userf = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: user.email })
      .getOne();

    if (!userf?.password) {
      throw new ForbiddenException('Current password is incorrect');
    }
    const isMatch = await bcrypt.compare(b.currentPassword, userf.password);
    if (!isMatch) {
      throw new ForbiddenException('Current password is incorrect');
    }

    // Hash the new password
    const newPasswordHash = await this.hashPassword(
      b.newPassword,
      await bcrypt.genSalt(),
    );

    // Update the user's password
    userf.password = newPasswordHash;
    userf.sessionVersion += 1;
    await this.userRepo.save(userf);
    return { message: 'Password changed' };
  }
  private async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
  async changeVerifyEmail(email: string, token: string, user: User) {
    email = email?.trim().toLowerCase();
    if (!email || !token) {
      throw new BadRequestException('Email and token are required');
    }
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      return await this.userRepo.manager.transaction(async (manager) => {
        // Delete is the authorization check: exactly one concurrent/replayed
        // request can consume this address-bound, unexpired token.
        const consumed = await manager
          .createQueryBuilder()
          .delete()
          .from(Token)
          .where('email = :email', { email })
          .andWhere('token = :token', { token })
          .andWhere('type = :type', {
            type: TokenType.EMAIL_VERIFICATION,
          })
          .andWhere('date >= :cutoff', { cutoff })
          .returning('id')
          .execute();
        if (consumed.affected !== 1) {
          throw new BadRequestException('Invalid or expired email token');
        }

        const userRepo = manager.getRepository(User);
        await userRepo.update(
          { id: user.id },
          {
            email,
            // Other sessions should not survive an account-identity change.
            sessionVersion: () => '"sessionVersion" + 1',
          },
        );
        return { email, changed: true };
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException('Email already in use.');
      }
      throw new InternalServerErrorException('Error saving user data.');
    }
  }
  async changeSendEmail(email: string) {
    return await this.sendRegisterEmail(email);
  }
  async sendRegisterToken(email: string) {
    //check if email is valid
    email = email?.toLowerCase();
    const foundUser = await this.userRepo.findOneBy({ email });
    if (foundUser) {
      throw new ConflictException('Email already in use.');
    }
    // await this.sendRegisterEmail(authCredentialsDto.email);
    return 'Email sent';
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      '127.0.0.1'
    );
  }

  async verifyCloudflareToken(token: string, req: Request) {
    if (process.env.TURNSTILE_ENABLED !== 'true')
      return { success: true, disabled: true };
    const clientIp = this.getClientIp(req);
    const response = await fetch(
      `https://challenges.cloudflare.com/turnstile/v0/siteverify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: process.env.CLOUDFLARE_TURNSTILE_KEY,
          response: token,
          remoteip: clientIp,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new BadRequestException('Failed to verify user');
    }

    return data;
  }

  // Handles that would collide with official/system namespaces or routes.
  private static readonly RESERVED_USERNAMES = [
    'compify',
    'admin',
    'api',
    'www',
    'registry',
    'docs',
    'blog',
    'support',
    'help',
    'team',
    'official',
    'system',
    'root',
    'cdn',
    'assets',
    'static',
  ];

  async checkIfUsernameIsAvailable(username: string) {
    if (UserService.RESERVED_USERNAMES.includes(username.toLowerCase())) {
      throw new BadRequestException('Username is reserved');
    }
    const user = await this.userRepo.findOneBy({ username });
    if (user) {
      throw new BadRequestException('Username is already taken');
    }
    return true;
  }

  async signUp(signUpDto: SignUpDto, req: Request): Promise<any> {
    if (this.isBlockedDomain(signUpDto.email)) {
      throw new BadRequestException(
        'Temporary email providers are not allowed',
      );
    }
    await this.verifyCloudflareToken(signUpDto.turnstileToken, req);

    const emailEnabled = this.emailService.isConfigured();
    const user = await this.createUser(signUpDto, !emailEnabled);
    if (emailEnabled) {
      await this.sendRegisterEmail(signUpDto.email, signUpDto.firstName);
    } else {
      await this.createFreeSubscription(user);
    }
    return 'ok';
  }
  async resendRegisterEmail(email: string) {
    email = email?.toLowerCase();
    const user = await this.userRepo.findOneBy({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.sendRegisterEmail(email, user.firstName);
  }
  async createFreeSubscription(user: User) {
    await this.subscriptionRepo.update(
      { user: { id: user.id } },
      { status: SubscriptionStatus.EXPIRED },
    );
    await this.subscriptionRepo.save({
      user: { id: user.id },
      plan: { id: process.env.FREE_PLAN_ID },
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      lastResetDate: new Date(),
      endDate: null,
    });
    await this.userRepo.update(
      { id: user.id },
      {
        availableFreeAiCredits: 100,
        availableCredits: 25,
        availableAiCredits: 50,
      },
    );
  }
  async sendRegisterEmail(email: string, name?: string) {
    email = email?.toLowerCase();

    const latestToken = await this.tokenRepo
      .createQueryBuilder('token')
      .where('token.email = :email', { email: email })
      .andWhere('token.type = :type', { type: TokenType.EMAIL_VERIFICATION })
      .orderBy('token.date', 'DESC')
      .groupBy('token.id')
      .getOne();

    if (
      latestToken &&
      (new Date().getTime() - new Date(latestToken.date).getTime()) / 60000 < 3
    ) {
      throw new InternalServerErrorException(
        'You can request only once in 3 minutes',
      );
    } else {
      if (latestToken) {
        await this.tokenRepo.delete({
          email: email,
          token: latestToken.token,
          type: TokenType.EMAIL_VERIFICATION,
        });
      }
      const token = crypto.randomInt(1_000_000, 10_000_000).toString();

      await this.tokenRepo.save({
        email: email,
        token: token,
        type: TokenType.EMAIL_VERIFICATION,
      });
      this.emailService.sendEmail(
        email,
        name,
        'Email verification',
        generateEmailTemplate({
          name,
          email,
          token,
          frontendUrl: process.env.FRONTEND_URL,
        }),
      );
      return { message: 'Email sent' };
    }
  }
  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async resetPassword(token: string, password: string, email: string) {
    email = email?.trim().toLowerCase();
    if (!email || !token || !password) {
      throw new BadRequestException('Email, token and password are required');
    }

    const hashedPassword = await this.hashPassword(
      password,
      await bcrypt.genSalt(),
    );
    const tokenHash = this.hashResetToken(token);
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);

    // Consuming the token and updating the password in one transaction makes
    // concurrent/replayed reset requests safe: exactly one delete can win.
    await this.userRepo.manager.transaction(async (manager) => {
      const consumed = await manager
        .createQueryBuilder()
        .delete()
        .from(Token)
        .where('email = :email', { email })
        // Accept pre-deployment plaintext tokens during the short transition.
        .andWhere('token IN (:...tokens)', { tokens: [tokenHash, token] })
        .andWhere('type = :type', { type: TokenType.RESET_PASSWORD })
        .andWhere('date >= :cutoff', { cutoff })
        .returning('id')
        .execute();

      if (consumed.affected !== 1) {
        throw new BadRequestException(
          'Invalid or expired password reset link.',
        );
      }

      const userRepo = manager.getRepository(User);
      const found = await userRepo.findOneBy({ email });
      if (!found) {
        throw new NotFoundException('User not found');
      }
      await userRepo.update(
        { id: found.id },
        {
          password: hashedPassword,
          sessionVersion: () => '"sessionVersion" + 1',
        },
      );
    });

    return { success: true };
  }

  async resetPasswordUser(email: string) {
    email = email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    const generic = {
      message: 'If an account exists, a password reset email has been sent',
    };
    const user = await this.userRepo
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .getOne();
    if (user) {
      try {
        await this.sendResetPassword(user.email);
      } catch (error) {
        // Cooldowns and mail-provider failures must not become an account
        // existence oracle. Operators still get the diagnostic server-side.
        console.error('Password reset delivery was not scheduled:', error);
      }
    }
    return generic;
  }
  async deleteUserComponentFiles(componentIds: string[]): Promise<void> {
    const fileIds = componentIds;

    const imageIds = componentIds.flatMap((id) => {
      const shortId = uuidToShortId(id);
      return [shortId, `${shortId}-og`];
    });

    await Promise.all([
      this.minioService.deleteFiles('components', fileIds),
      this.minioService.deleteFiles('images', imageIds),
    ]);
  }

  async deleteAccount(user: User) {
    const components = await this.compRepo.find({
      where: { user: { id: user.id } },
    });

    const componentIds = components.map((comp) => comp.id);

    if (componentIds.length > 0) {
      // Delete files first
      await this.deleteUserComponentFiles(componentIds);

      // Delete themes for these components
      await this.themeRepo.delete({ component: { id: In(componentIds) } });
    }

    // Delete all related entities in the correct order to avoid foreign key constraints
    await this.upvoteRepo.delete({ user: { id: user.id } });
    await this.reportRepo.delete({ user: { id: user.id } });
    await this.userUsedComponentsRepo.delete({ user: { id: user.id } });
    await this.compRepo.delete({ user: { id: user.id } });
    await this.cliTokenRepo.delete({ user: { id: user.id } });
    await this.subscriptionRepo.delete({ user: { id: user.id } });
    await this.tokenRepo.delete({ email: user.email });
    await this.userRepo.delete(user.id);

    return { message: 'Account deleted' };
  }

  async validatePasswordResetToken(b: VerifyAccountDto) {
    const email = b?.email?.trim().toLowerCase();
    const token = b?.token;
    if (!email || !token) {
      throw new BadRequestException('Email and token are required');
    }

    const tokenHash = this.hashResetToken(token);
    const latestToken = await this.tokenRepo
      .createQueryBuilder('token')
      .where('token.email = :email', { email })
      .andWhere('token.token IN (:...tokens)', { tokens: [tokenHash, token] })
      .andWhere('token.type = :type', { type: TokenType.RESET_PASSWORD })
      .andWhere('token.date >= :cutoff', {
        cutoff: new Date(Date.now() - 60 * 60 * 1000),
      })
      .getOne();

    if (!latestToken?.id) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }
    return { valid: true };
  }

  async sendResetPassword(email: string) {
    email = email?.trim().toLowerCase();

    const latestToken = await this.tokenRepo
      .createQueryBuilder('token')
      .where('token.email = :email', { email })
      .andWhere('token.type = :type', { type: TokenType.RESET_PASSWORD })
      .orderBy('token.date', 'DESC')
      .getOne();

    if (
      latestToken &&
      (Date.now() - new Date(latestToken.date).getTime()) / 60000 < 3
    ) {
      throw new InternalServerErrorException(
        'You can request only once in 3 minutes',
      );
    }

    // Invalidate every previous reset link, and never persist the bearer
    // token itself. The existing token column can hold the SHA-256 digest, so
    // this hardening does not require a schema migration.
    await this.tokenRepo.delete({
      email,
      type: TokenType.RESET_PASSWORD,
    });
    const token = crypto.randomBytes(32).toString('hex');
    await this.tokenRepo.save({
      email,
      token: this.hashResetToken(token),
      type: TokenType.RESET_PASSWORD,
    });

    await this.emailService.sendEmail(
      email,
      '',
      'Password reset',
      generatePasswordResetTemplate({
        email,
        token,
        frontendUrl: process.env.FRONTEND_URL,
      }),
    );
    return { message: 'Email sent' };
  }

  async verifyEmail(b: VerifyAccountDto) {
    const email = decodeURIComponent(b?.email);
    const latestToken = await this.tokenRepo
      .createQueryBuilder('token')
      .where('token.email = :email AND token.token = :token', {
        email,
        token: b?.token,
      })
      .andWhere('token.type = :type', { type: TokenType.EMAIL_VERIFICATION })
      .orderBy('token.date', 'DESC')
      .groupBy('token.id')
      .getOne();

    if (!latestToken?.id) {
      throw new InternalServerErrorException('Token not found');
    }
    const tokenDate = new Date(latestToken.date);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    if (tokenDate < oneDayAgo) {
      throw new InternalServerErrorException('Token expired');
    }
    const user = await this.userRepo.findOneBy({ email });
    user.valid = true;

    try {
      const userRepo = await this.userRepo.save(user);
      await this.createFreeSubscription(userRepo);
      return await this.whoami(userRepo);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already in use.');
      } else {
        throw new InternalServerErrorException(
          'An error occurred while creating the user.',
        );
      }
    }
  }

  async checkEmail(email: string) {
    email = email?.toLowerCase();
    const foundUser = await this.userRepo.findOneBy({ email });

    return { valid: !foundUser?.id };
  }

  /**
   * Derive a unique username from an email's local part, appending suffixes
   * until it no longer collides with an existing user.
   */
  private async generateUniqueUsername(email: string): Promise<string> {
    let base = email?.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
    if (!base || base.length < 3) {
      base = `user${crypto.randomInt(0, 10_000)}`;
    }

    let username = base;
    for (let attempt = 0; attempt < 5; attempt++) {
      const reserved = UserService.RESERVED_USERNAMES.includes(
        username.toLowerCase(),
      );
      const existing = reserved
        ? true
        : await this.userRepo.findOneBy({ username });
      if (!existing) {
        return username;
      }
      username = `${base}${crypto.randomInt(0, 10 ** (attempt + 2))}`;
    }
    return `user${Date.now()}${crypto.randomInt(0, 1_000)}`;
  }

  async createUser(signUpDto: SignUpDto, verified = false): Promise<User> {
    if (!signUpDto.email) {
      throw new BadRequestException('Email is required');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(signUpDto.password, salt);

    const user = new User();
    user.email = signUpDto?.email?.toLowerCase();
    user.firstName = signUpDto?.firstName;
    user.lastName = signUpDto?.lastName;
    user.password = hashedPassword;
    user.username = await this.generateUniqueUsername(user.email);
    user.valid = verified;

    try {
      return await this.userRepo.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Email already in use.');
      } else {
        throw new InternalServerErrorException(
          'An error occurred while creating the user.',
        );
      }
    }
  }

  async validateUserPassword(authCredentialsDto: AuthCredentialsDto) {
    const { email, password } = authCredentialsDto;

    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
    const validPassword = await bcrypt.compare(
      password,
      user?.password || DUMMY_PASSWORD_HASH,
    );
    if (!user || !validPassword) {
      return null;
    }
    if (!user.valid) {
      throw new ForbiddenException('Please verify your email first.');
    }
    return { id: user.id, sessionVersion: user.sessionVersion };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepo.findOneBy({ id });
    return user ? user : null;
  }

  private async getAccessToken(payload: JwtPayload): Promise<string> {
    const secret = process.env.JWT_SECRET;
    return this.jwtService.sign(payload, { secret });
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<{ accessToken: string }> {
    const resp = await this.validateUserPassword(authCredentialsDto);
    if (!resp) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const plan = await this.getUserSubscriptionPlan({ id: resp.id });
    const accessToken = await this.getAccessToken({
      id: resp.id,
      plan,
      sessionVersion: resp.sessionVersion,
    });

    return {
      accessToken,
    };
  }

  async confirmPassword(user: User, password: string) {
    const userData = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: user.email })
      .getOne();
    if (
      userData &&
      (await user.validatePassword(password, userData.password))
    ) {
      return true;
    } else {
      throw new NotAcceptableException('Wrong password.');
    }
  }

  async whoami(user: User) {
    const respo = await this.userRepo
      .createQueryBuilder('user')
      .where('user.id = :id', { id: user?.id })
      .leftJoinAndSelect('user.subscriptions', 'subscriptions')
      .leftJoinAndSelect('subscriptions.plan', 'plan')
      .orderBy('subscriptions.startDate', 'DESC')
      .getOne();
    const data = {
      id: respo?.id,
      email: respo?.email,
      firstName: respo?.firstName,
      lastName: respo?.lastName,
      username: respo?.username,
      valid: respo?.valid,
      plan: respo?.subscriptions?.[0]?.plan?.name,
    };
    return data;
  }

  async getUserSubscriptionPlan(user: any) {
    return await this.subscriptionRepo
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.user = :user', { user: user.id })
      .getOne()
      .then((subscription) => subscription?.plan?.name);
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new UnauthorizedException();
    }

    // Find existing user or create new one
    let user = await this.userRepo.findOneBy({ email: googleUser.email });

    if (!user) {
      user = new User();
      user.email = googleUser.email.toLowerCase();
      user.firstName = googleUser.firstName;
      user.lastName = googleUser.lastName;
      user.valid = true; // Google users are pre-verified
      user.username = await this.generateUniqueUsername(user.email);
      try {
        user = await this.userRepo.save(user);
        await this.createFreeSubscription(user);
      } catch (error) {
        if (error.code === '23505') {
          throw new ConflictException('Email address already exists.');
        } else {
          throw new InternalServerErrorException(
            'An error occurred while creating the user.',
          );
        }
      }
    }

    if (!user?.valid) {
      user.valid = true;
      await this.userRepo.save(user);
      await this.createFreeSubscription(user);
    }

    const plan = await this.getUserSubscriptionPlan(user);
    const accessToken = await this.getAccessToken({
      id: user.id,
      plan,
      sessionVersion: user.sessionVersion,
    });

    return { accessToken };
  }
}
