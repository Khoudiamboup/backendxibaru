import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
  console.log('Recherche utilisateur par email:', email);
  const user = await this.userRepository.findOne({ where: { userEmail: email } });
  console.log('Utilisateur trouvé:', user ? user.userEmail : 'Aucun');
  if (user) {
    console.log('Mot de passe en DB:', user.userPass);
  }
  return user;
}


  async create(email: string, password: string) {
    const user = this.userRepository.create({ 
      userEmail: email, 
      userPass: password // ⚠️ Attention, pas de hash ici
    });
    return this.userRepository.save(user);
  }
}
