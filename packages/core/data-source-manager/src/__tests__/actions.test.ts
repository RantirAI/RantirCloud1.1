import { list } from '../default-actions/list';
import { vi } from 'vitest';
import { move } from '../default-actions/move';

describe('action test', () => {
  describe('list action', async () => {
    it('should list with paginate', async () => {
      const listAction = list;

      const ctx: any = {
        getCurrentRepository() {
          return {};
        },
        action: {
          params: {
            paginate: true,
          },
        },
      };

      vi.spyOn(ctx, 'getCurrentRepository').mockImplementation(() => {
        return {
          findAndCount: async () => [
            [
              {
                id: 1,
                name: 'test',
              },
              {
                id: 2,
                name: 'test2',
              },
            ],
            2,
          ],
        };
      });

      await listAction(ctx, () => {});

      expect(ctx.body).toMatchObject({
        count: 2,
        rows: [
          { id: 1, name: 'test' },
          { id: 2, name: 'test2' },
        ],
        page: 1,
        pageSize: 50,
        totalPage: 1,
      });
    });

    it('should list with non paginate', async () => {
      const listAction = list;

      const ctx: any = {
        getCurrentRepository() {
          return {};
        },
        action: {
          params: {
            paginate: false,
          },
        },
      };

      vi.spyOn(ctx, 'getCurrentRepository').mockImplementation(() => {
        return {
          find: async () => [
            {
              id: 1,
              name: 'test',
            },
            {
              id: 2,
              name: 'test2',
            },
          ],
        };
      });

      await listAction(ctx, () => {});

      expect(ctx.body).toMatchObject([
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ]);
    });
  });

  describe('move action', async () => {
    it('should move when repository can move', async () => {
      const moveAction = move;

      const ctx: any = {
        getCurrentRepository() {
          return {};
        },
        action: {
          params: {
            filterByTk: 1,
            targetCollection: 'test',
          },
        },
      };

      const moveFn = vi.fn();

      vi.spyOn(ctx, 'getCurrentRepository').mockImplementation(() => {
        return {
          move: async () => {
            moveFn();
          },
        };
      });

      await moveAction(ctx, () => {});

      expect(moveFn).toHaveBeenCalled();
    });
  });
});