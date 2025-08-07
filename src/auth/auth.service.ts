import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

async validateUser(email: string, pass: string): Promise<any> {
  const user = await this.userService.findByEmail(email);
  if (user && (await bcrypt.compare(pass, user.userPass))) {
    const { userPass, ...result } = user;
    return result;
  }
  return null;
}


   async refreshToken(token: string) {
    // Implémentation réelle du refresh token
    try {
      const decoded = this.jwtService.verify(token);
      const payload = { sub: decoded.sub, email: decoded.email };
      const accessToken = await this.jwtService.signAsync(payload);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Token invalide');
    }
  }

  async logout(token: string) {
    return { message: 'Logged out' };
  }

async login(email: string, password: string) {
  const user = await this.userService.findByEmail(email);

  if (!user) {
    throw new NotFoundException('Utilisateur non trouvé');
  }

  if (user.userPass !== password) {  // ⚠️ comparer sans hash temporairement
    throw new UnauthorizedException('Mot de passe incorrect');
  }

  const payload = { username: user.userEmail, sub: user.ID };  // utiliser userEmail et ID
  return {
    access_token: this.jwtService.sign(payload),
  };
}

}
