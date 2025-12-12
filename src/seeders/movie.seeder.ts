import { DataSource } from 'typeorm';
import { Movie } from '../movies/entities/movie.entity';
import { Actor } from '../actors/entities/actor.entity';
import { Cast } from '../cast/entities/cast.entity';

export async function seedMovies(dataSource: DataSource): Promise<void> {
  const movieRepository = dataSource.getRepository(Movie);
  const actorRepository = dataSource.getRepository(Actor);
  const castRepository = dataSource.getRepository(Cast);

  // Insertar películas
  const movies = await movieRepository.save([
    {
      title: 'Inception',
      releaseDate: new Date('2010-07-16'),
      genres: ['Sci-Fi', 'Action', 'Thriller'],
      duration: 148,
      trending: true,
      rating: 8.8,
      description: 'A mind-bending thriller about dreams',
      clasification: 'PG-13'
    },
    {
      title: 'The Dark Knight',
      releaseDate: new Date('2008-07-18'),
      genres: ['Action', 'Crime', 'Drama'],
      duration: 152,
      trending: true,
      rating: 9.0,
      description: 'Batman faces the Joker in this epic crime thriller',
      clasification: 'PG-13'
    },
    {
      title: 'Interstellar',
      releaseDate: new Date('2014-11-07'),
      genres: ['Science Fiction', 'Drama', 'Adventure'],
      duration: 169,
      trending: false,
      rating: 8.6,
      description: 'A team of explorers travel through a wormhole in space',
      clasification: 'PG-13'
    }
  ]);

  // Insertar actores
  const actors = await actorRepository.save([
    {
      firstName: 'Leonardo',
      lastName: 'DiCaprio',
      nickName: 'Leo',
      birthdate: new Date('1974-11-11'),
      popularity: 95.5
    },
    {
      firstName: 'Cillian',
      lastName: 'Murphy',
      nickName: 'Cillian',
      birthdate: new Date('1976-05-25'),
      popularity: 85.2
    },
    {
      firstName: 'Joseph',
      lastName: 'Gordon-Levitt',
      nickName: 'Joe',
      birthdate: new Date('1981-02-17'),
      popularity: 82.3
    },
    {
      firstName: 'Tom',
      lastName: 'Hardy',
      nickName: 'Tom',
      birthdate: new Date('1977-09-15'),
      popularity: 88.7
    },
    {
      firstName: 'Christian',
      lastName: 'Bale',
      birthdate: new Date('1974-01-30'),
      popularity: 92.1
    },
    {
      firstName: 'Heath',
      lastName: 'Ledger',
      birthdate: new Date('1979-04-04'),
      popularity: 90.0
    },
    {
      firstName: 'Gary',
      lastName: 'Oldman',
      birthdate: new Date('1958-03-21'),
      popularity: 87.5
    },
    {
      firstName: 'Aaron',
      lastName: 'Eckhart',
      birthdate: new Date('1968-03-12'),
      popularity: 75.8
    },
    {
      firstName: 'Matthew',
      lastName: 'McConaughey',
      nickName: 'Matt',
      birthdate: new Date('1969-11-04'),
      popularity: 89.3
    },
    {
      firstName: 'Anne',
      lastName: 'Hathaway',
      birthdate: new Date('1982-11-12'),
      popularity: 86.4
    },
    {
      firstName: 'Jessica',
      lastName: 'Chastain',
      birthdate: new Date('1977-03-24'),
      popularity: 84.6
    },
    {
      firstName: 'Timothee',
      lastName: 'Chalamet',
      birthdate: new Date('1995-12-27'),
      popularity: 91.2
    }
  ]);

  // Insertar elenco (cast)
  await castRepository.save([
    {
      movieId: movies[0].id,
      actorId: actors[0].id,
      role: 'Lead',
      characters: ['Dom Cobb']
    },
    {
      movieId: movies[0].id,
      actorId: actors[1].id,
      role: 'Support',
      characters: ['Robert Fisher']
    },
    {
      movieId: movies[0].id,
      actorId: actors[2].id,
      role: 'Support',
      characters: ['Arthur']
    },
    {
      movieId: movies[0].id,
      actorId: actors[3].id,
      role: 'Support',
      characters: ['Eames']
    },
    {
      movieId: movies[1].id,
      actorId: actors[4].id,
      role: 'Lead',
      characters: ['Bruce Wayne', 'Batman']
    },
    {
      movieId: movies[1].id,
      actorId: actors[5].id,
      role: 'Antagonist',
      characters: ['Joker']
    },
    {
      movieId: movies[1].id,
      actorId: actors[6].id,
      role: 'Support',
      characters: ['James Gordon']
    },
    {
      movieId: movies[1].id,
      actorId: actors[7].id,
      role: 'Antagonist',
      characters: ['Harvey Dent', 'Two-Face']
    },
    {
      movieId: movies[2].id,
      actorId: actors[8].id,
      role: 'Lead',
      characters: ['Joseph Cooper']
    },
    {
      movieId: movies[2].id,
      actorId: actors[9].id,
      role: 'Support',
      characters: ['Amelia Brand']
    },
    {
      movieId: movies[2].id,
      actorId: actors[10].id,
      role: 'Support',
      characters: ['Murph Cooper']
    },
    {
      movieId: movies[2].id,
      actorId: actors[11].id,
      role: 'Support',
      characters: ['Tom Cooper']
    }
  ]);

  console.log('✅ Seeders ejecutados correctamente');
  console.log(`   - ${movies.length} películas creadas`);
  console.log(`   - ${actors.length} actores creados`);
  console.log(`   - ${await castRepository.count()} relaciones cast creadas`);
}
